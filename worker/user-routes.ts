import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import { CustomerEntity, TransactionEntity, PromoEntity, ReservationEntity, FeedbackEntity, LoyaltyEventEntity, NotificationEntity } from './entities';
import type { Customer, DashboardStats, Transaction, Reservation, Feedback, Notification, AggregatedReport, ReportType, CustomerGroup, MembershipLevel, Promo, ReservationCreate, FeedbackCreate } from "@shared/types";
import { subDays, format, parseISO, isWithinInterval } from 'date-fns';
let seeded = false;
const seedMiddleware = async (c: any, next: any) => {
  if (!seeded && c.env.GlobalDurableObject) {
    try {
      await Promise.all([
        CustomerEntity.ensureSeed(c.env),
        TransactionEntity.ensureSeed(c.env),
        PromoEntity.ensureSeed(c.env),
        ReservationEntity.ensureSeed(c.env),
        FeedbackEntity.ensureSeed(c.env),
        LoyaltyEventEntity.ensureSeed(c.env),
        NotificationEntity.ensureSeed(c.env),
      ]);
      seeded = true;
      console.log('Database seeded successfully.');
    } catch (e) {
      console.error('Seeding failed:', e);
    }
  }
  await next();
};
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return bad(c, 'Unauthorized: Missing token');
  const token = authHeader.replace('Bearer ', '');
  if (token.startsWith('customer-jwt-')) {
    const customerId = token.split('-')[2];
    c.set('role', 'customer');
    c.set('customer_id', customerId);
  } else if (token === 'demo-admin-jwt') {
    c.set('role', 'admin');
  } else {
    c.set('role', 'staff');
  }
  await next();
};
const encrypt = (str: string | undefined) => str ? btoa(str) : undefined;
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/*', seedMiddleware);
  // Public route for login
  app.post('/api/customers/login', async (c) => {
    const { phone_number, otp } = await c.req.json<{ phone_number: string, otp: string }>();
    if (!isStr(phone_number) || otp !== '1234') return bad(c, 'Invalid credentials');
    const all = await CustomerEntity.list(c.env);
    const customer = all.items.find(cust => cust.phone_number === phone_number);
    if (!customer) return notFound(c, 'Customer not found');
    const token = `customer-jwt-${customer.id}`;
    return ok(c, { token, customer: { ...customer, phone_number: encrypt(customer.phone_number), email: encrypt(customer.email) } });
  });
  app.use('/api/*', authMiddleware);
  // DASHBOARD
  app.get('/api/dashboard/stats', async (c) => {
    const [customers, transactions, promos] = await Promise.all([
      CustomerEntity.list(c.env),
      TransactionEntity.list(c.env),
      PromoEntity.list(c.env),
    ]);
    const totalRevenue = transactions.items.reduce((sum, t) => sum + t.total_amount, 0);
    const customerActivity = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      return { date: format(date, 'MMM d'), visits: Math.floor(Math.random() * 20) + 5 };
    }).reverse();
    const stats: DashboardStats = {
      totalCustomers: customers.items.length,
      todaysVisits: Math.floor(Math.random() * 30) + 10,
      activePromos: promos.items.filter(p => p.is_active).length,
      totalRevenue,
      customerActivity,
      topCustomers: [...customers.items].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5),
      recentTransactions: [...transactions.items].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 5),
    };
    return ok(c, stats);
  });
  // CUSTOMERS
  app.get('/api/customers', async (c) => {
    const role = (c as any).get('role');
    if (role === 'customer') {
      const customerId = (c as any).get('customer_id');
      const customer = new CustomerEntity(c.env, customerId);
      if (!(await customer.exists())) return notFound(c, 'Customer not found');
      const state = await customer.getState();
      return ok(c, [{ ...state, phone_number: encrypt(state.phone_number), email: encrypt(state.email) }]);
    }
    return ok(c, (await CustomerEntity.list(c.env)).items);
  });
  app.get('/api/customers/group', async (c) => {
    const customers = (await CustomerEntity.list(c.env)).items;
    const groups: Record<MembershipLevel, { count: number; total_spent: number }> = { Bronze: { count: 0, total_spent: 0 }, Silver: { count: 0, total_spent: 0 }, Gold: { count: 0, total_spent: 0 }, Platinum: { count: 0, total_spent: 0 } };
    customers.forEach(cust => { groups[cust.membership_level].count++; groups[cust.membership_level].total_spent += cust.total_spent; });
    const result: CustomerGroup[] = Object.entries(groups).map(([level, data]) => ({ level: level as MembershipLevel, ...data }));
    return ok(c, result);
  });
  app.get('/api/customers/:id', async (c) => {
    const role = (c as any).get('role');
    const customerId = (c as any).get('customer_id');
    const requestedId = c.req.param('id');
    if (role === 'customer' && requestedId !== customerId) return bad(c, 'Access denied');
    const customer = new CustomerEntity(c.env, requestedId);
    if (!(await customer.exists())) return notFound(c, 'Customer not found');
    const state = await customer.getState();
    return ok(c, { ...state, phone_number: encrypt(state.phone_number), email: encrypt(state.email) });
  });
  app.get('/api/customers/:id/transactions', async (c) => {
    const role = (c as any).get('role');
    const customerId = (c as any).get('customer_id');
    const requestedId = c.req.param('id');
    if (role === 'customer' && requestedId !== customerId) return bad(c, 'Access denied');
    return ok(c, (await TransactionEntity.list(c.env)).items.filter(t => t.customer_id === requestedId));
  });
  app.post('/api/customers/register', async (c) => {
    const { phone_number, name, email } = await c.req.json<{ phone_number: string, name: string, email?: string }>();
    if (!isStr(phone_number) || !isStr(name)) return bad(c, 'Phone number and name are required');
    let customer = (await CustomerEntity.list(c.env)).items.find(cust => cust.phone_number === phone_number);
    if (customer) return ok(c, { ...customer, existed: true });
    const newCustomerData: Customer = { id: crypto.randomUUID(), phone_number, name, email, membership_level: 'Bronze', total_visits: 1, total_spent: 0, loyalty_points: 0, registration_date: new Date().toISOString(), last_visit: new Date().toISOString(), avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name.split(' ')[0]}` };
    const newCustomer = await CustomerEntity.create(c.env, newCustomerData);
    const notif: Notification = { id: crypto.randomUUID(), customer_id: newCustomer.id, type: 'registration', message: `Welcome to Salt N Bite, ${name}!`, status: 'queued' };
    await NotificationEntity.create(c.env, notif);
    console.log(`[AUDIT] New customer registered: ${name}.`);
    return ok(c, { ...newCustomer, existed: false });
  });
  // TRANSACTIONS
  app.post('/api/transactions/sync', async (c) => {
    const { pos_transaction_id, customer_id, total_amount, items, payment_method } = await c.req.json<Partial<Transaction>>();
    if (!pos_transaction_id) return bad(c, 'pos_transaction_id is required');
    if ((await TransactionEntity.list(c.env)).items.some(t => t.pos_transaction_id === pos_transaction_id)) return ok(c, { message: 'Transaction already synced' });
    const newTxData: Transaction = { id: crypto.randomUUID(), pos_transaction_id, customer_id: customer_id || 'cust_anonymous', total_amount: total_amount || 0, transaction_date: new Date().toISOString(), payment_method: payment_method || 'Cash', loyalty_points_earned: Math.floor((total_amount || 0) / 10000), items: items || [] };
    const newTx = await TransactionEntity.create(c.env, newTxData);
    if (customer_id && customer_id !== 'cust_anonymous') {
      const customer = new CustomerEntity(c.env, customer_id);
      if (await customer.exists()) await customer.mutate(s => ({ ...s, total_visits: s.total_visits + 1, total_spent: s.total_spent + (total_amount || 0), loyalty_points: s.loyalty_points + newTx.loyalty_points_earned, last_visit: newTx.transaction_date }));
    }
    return ok(c, newTx);
  });
  // PROMOS
  app.get('/api/promos', async (c) => {
    const customer_id = c.req.query('customer_id');
    let promos = (await PromoEntity.list(c.env)).items;
    if (customer_id) {
      const customer = new CustomerEntity(c.env, customer_id);
      if (await customer.exists()) {
        const state = await customer.getState();
        promos = promos.filter(p => p.promo_type === 'event' || p.promo_type === 'birthday' || p.promo_type === state.membership_level.toLowerCase());
      }
    }
    return ok(c, promos);
  });
  app.post('/api/promos', async (c) => {
    const { promo_name, promo_type, description, start_date, end_date } = await c.req.json<Partial<Promo>>();
    if (!isStr(promo_name) || !isStr(promo_type) || !isStr(start_date)) return bad(c, 'Invalid promo data');
    const promo: Promo = { id: crypto.randomUUID(), promo_name, promo_type, description: description || '', start_date, end_date: end_date || '', is_active: !end_date || new Date(end_date) >= new Date() };
    await PromoEntity.create(c.env, promo);
    console.log(`[AUDIT] Promo created: ${promo_name}`);
    return ok(c, promo);
  });
  app.put('/api/promos/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Promo>>();
    const promo = new PromoEntity(c.env, id);
    if (!(await promo.exists())) return notFound(c, 'Promo not found');
    const updated = await promo.mutate(s => ({ ...s, ...body }));
    console.log(`[AUDIT] Promo updated: ${updated.promo_name}`);
    return ok(c, updated);
  });
  app.delete('/api/promos/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await PromoEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Promo not found');
    console.log(`[AUDIT] Promo deleted: ${id}`);
    return ok(c, { id });
  });
  app.post('/api/promos/redeem', async (c) => {
    const { promo_id, customer_id } = c.req.query();
    const role = (c as any).get('role');
    const authCustomerId = (c as any).get('customer_id');
    if (role !== 'customer' || authCustomerId !== customer_id) return bad(c, 'Access denied');
    if (!promo_id || !customer_id) return bad(c, 'Missing promo_id or customer_id');
    const promoEntity = new PromoEntity(c.env, promo_id);
    if (!(await promoEntity.exists())) return notFound(c, 'Promo not found');
    const promo = await promoEntity.getState();
    if (!promo.is_active || !isWithinInterval(new Date(), { start: parseISO(promo.start_date), end: parseISO(promo.end_date) })) return bad(c, 'Promo not active');
    const customerEntity = new CustomerEntity(c.env, customer_id);
    if (!(await customerEntity.exists())) return notFound(c, 'Customer not found');
    const customer = await customerEntity.getState();
    if (customer.membership_level.toLowerCase() !== promo.promo_type && promo.promo_type !== 'event' && promo.promo_type !== 'birthday') return bad(c, 'Not eligible for this promo');
    const cost = 50; // Stub cost
    if (customer.loyalty_points < cost) return bad(c, 'Insufficient points');
    const updatedCustomer = await customerEntity.mutate(s => ({ ...s, loyalty_points: s.loyalty_points - cost }));
    await NotificationEntity.create(c.env, { id: crypto.randomUUID(), customer_id, type: 'promo', message: `You redeemed ${promo.promo_name}!`, status: 'queued' });
    return ok(c, updatedCustomer);
  });
  // RESERVATIONS
  app.post('/api/reservations', async (c) => {
    const { customer_phone, reservation_date, reservation_time, number_of_guests, notes } = await c.req.json<ReservationCreate>();
    if (!customer_phone || !reservation_date || !reservation_time || !number_of_guests) return bad(c, 'Missing required fields');
    let customer = (await CustomerEntity.list(c.env)).items.find(cust => cust.phone_number === customer_phone);
    if (!customer) {
      const newCustomerData: Customer = { id: crypto.randomUUID(), phone_number: customer_phone, name: 'New Customer', email: '', membership_level: 'Bronze', total_visits: 1, total_spent: 0, loyalty_points: 0, registration_date: new Date().toISOString(), last_visit: new Date().toISOString() };
      customer = await CustomerEntity.create(c.env, newCustomerData);
    }
    const reservation: Reservation = { id: crypto.randomUUID(), customer_id: customer.id, reservation_date: `${reservation_date}T${reservation_time}:00.000Z`, number_of_guests, status: 'confirmed', notes };
    await ReservationEntity.create(c.env, reservation);
    const notif: Notification = { id: crypto.randomUUID(), customer_id: customer.id, type: 'reservation', message: `Your reservation for ${format(new Date(reservation.reservation_date), 'PPP @ HH:mm')} is confirmed.`, status: 'queued' };
    await NotificationEntity.create(c.env, notif);
    console.log(`[AUDIT] Reservation created for ${customer.name}`);
    return ok(c, reservation);
  });
  app.get('/api/reservations/upcoming', async (c) => {
    const date = c.req.query('date');
    const customer_id = c.req.query('customer_id');
    if (!date) return bad(c, 'Date query parameter is required');
    let all = (await ReservationEntity.list(c.env)).items;
    if (customer_id) {
      all = all.filter(r => r.customer_id === customer_id);
    }
    const upcoming = all.filter(r => r.reservation_date.startsWith(date) && r.status !== 'cancelled');
    return ok(c, upcoming);
  });
  // REPORTING
  app.get('/api/reports/:type', async (c) => {
    const type = c.req.param('type') as ReportType;
    const { start, end } = c.req.query();
    if (!start || !end) return bad(c, 'Start and end dates are required');
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const transactions = (await TransactionEntity.list(c.env)).items.filter(t => isWithinInterval(parseISO(t.transaction_date), { start: startDate, end: endDate }));
    let report: AggregatedReport;
    switch (type) {
      case 'customer-activity': {
        const activityByDate = transactions.reduce((acc, t) => { const date = format(parseISO(t.transaction_date), 'yyyy-MM-dd'); acc[date] = (acc[date] || 0) + 1; return acc; }, {} as Record<string, number>);
        report = { type, period: { start, end }, metrics: { total: transactions.length }, data: Object.entries(activityByDate).map(([date, visits]) => ({ date, visits })) };
        break;
      }
      case 'promo-effectiveness': {
        const promos = (await PromoEntity.list(c.env)).items;
        const promoTxns = transactions.filter(t => t.promo_id);
        const promoData = promos.map(p => { const redemptions = promoTxns.filter(t => t.promo_id === p.id); return { promo_name: p.promo_name, redemptions: redemptions.length, revenue: redemptions.reduce((sum, t) => sum + t.total_amount, 0) }; });
        report = { type, period: { start, end }, metrics: { total: promoTxns.length }, data: promoData };
        break;
      }
      case 'loyalty-usage': {
        const earned = transactions.reduce((sum, t) => sum + t.loyalty_points_earned, 0);
        const spent = transactions.reduce((sum, t) => sum + (t.loyalty_points_used || 0), 0);
        report = { type, period: { start, end }, metrics: { total: earned - spent }, data: [{ type: 'Earned', points: earned }, { type: 'Spent', points: spent }] };
        break;
      }
      case 'feedback': {
        const feedbacks = (await FeedbackEntity.list(c.env)).items.filter(f => isWithinInterval(parseISO(f.feedback_date), { start: startDate, end: endDate }));
        const avgRating = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length : 0;
        const ratingCounts = feedbacks.reduce((acc, f) => { acc[f.rating] = (acc[f.rating] || 0) + 1; return acc; }, {} as Record<number, number>);
        report = { type, period: { start, end }, metrics: { total: feedbacks.length, avg: avgRating }, data: Object.entries(ratingCounts).map(([rating, count]) => ({ rating: Number(rating), count })) };
        break;
      }
      default: return notFound(c, 'Report type not found');
    }
    return ok(c, report);
  });
  // FEEDBACK
  app.post('/api/feedback', async (c) => {
    const { customer_id, transaction_id, rating, comment } = await c.req.json<FeedbackCreate>();
    if (!isStr(customer_id) || !isStr(transaction_id) || rating < 1 || rating > 5) return bad(c, 'Invalid feedback data');
    const fb: Feedback = { id: crypto.randomUUID(), customer_id, transaction_id, rating, comment: comment || '', feedback_date: new Date().toISOString() };
    await FeedbackEntity.create(c.env, fb);
    console.log(`[AUDIT] Feedback submitted for transaction ${transaction_id}`);
    return ok(c, fb);
  });
  app.get('/api/feedback/:customer_id', async (c) => {
    const role = (c as any).get('role');
    const authCustomerId = (c as any).get('customer_id');
    const requestedId = c.req.param('customer_id');
    if (role === 'customer' && requestedId !== authCustomerId) return bad(c, 'Access denied');
    const all = await FeedbackEntity.list(c.env);
    return ok(c, all.items.filter(f => f.customer_id === requestedId));
  });
  // NOTIFICATIONS
  app.post('/api/notifications/whatsapp', async (c) => {
    const { customer_id, type, message } = await c.req.json<Partial<Notification>>();
    if (!customer_id || !message || !type) return bad(c, 'Invalid notification data');
    const notif: Notification = { id: crypto.randomUUID(), customer_id, type, message, status: 'queued' };
    const entity = new NotificationEntity(c.env, notif.id);
    await entity.save(notif);
    // Mock send
    setTimeout(async () => {
      await entity.mutate(s => ({ ...s, status: 'sent', sent_at: new Date().toISOString() }));
      console.log(`[WHATSAPP MOCK] Sent to ${customer_id}: "${message}"`);
    }, 1500);
    return ok(c, notif);
  });
}
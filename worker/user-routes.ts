import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import { CustomerEntity, TransactionEntity, PromoEntity, ReservationEntity, FeedbackEntity, LoyaltyEventEntity, NotificationEntity } from './entities';
import type { Customer, DashboardStats, Transaction, Reservation, Feedback, Notification, AggregatedReport, ReportType, CustomerGroup, MembershipLevel, Promo, ReservationCreate } from "@shared/types";
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
  if (token === 'demo-admin-jwt') c.set('role', 'admin');
  else c.set('role', 'staff');
  await next();
};
const encrypt = (str: string | undefined) => str ? btoa(str) : undefined;
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/*', seedMiddleware);
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
  app.get('/api/customers', async (c) => ok(c, (await CustomerEntity.list(c.env)).items));
  app.get('/api/customers/group', async (c) => {
    const customers = (await CustomerEntity.list(c.env)).items;
    const groups: Record<MembershipLevel, { count: number; total_spent: number }> = { Bronze: { count: 0, total_spent: 0 }, Silver: { count: 0, total_spent: 0 }, Gold: { count: 0, total_spent: 0 }, Platinum: { count: 0, total_spent: 0 } };
    customers.forEach(cust => { groups[cust.membership_level].count++; groups[cust.membership_level].total_spent += cust.total_spent; });
    const result: CustomerGroup[] = Object.entries(groups).map(([level, data]) => ({ level: level as MembershipLevel, ...data }));
    return ok(c, result);
  });
  app.get('/api/customers/:id', async (c) => {
    const customer = new CustomerEntity(c.env, c.req.param('id'));
    if (!(await customer.exists())) return notFound(c, 'Customer not found');
    const state = await customer.getState();
    return ok(c, { ...state, phone_number: encrypt(state.phone_number), email: encrypt(state.email) });
  });
  app.get('/api/customers/:id/transactions', async (c) => ok(c, (await TransactionEntity.list(c.env)).items.filter(t => t.customer_id === c.req.param('id'))));
  app.post('/api/customers/register', async (c) => {
    const { phone_number, name, email } = await c.req.json<{ phone_number: string, name: string, email?: string }>();
    if (!isStr(phone_number) || !isStr(name)) return bad(c, 'Phone number and name are required');
    let customer = (await CustomerEntity.list(c.env)).items.find(cust => cust.phone_number === phone_number);
    if (customer) return ok(c, { ...customer, existed: true });
    const newCustomerData: Customer = { id: crypto.randomUUID(), phone_number, name, email, membership_level: 'Bronze', total_visits: 1, total_spent: 0, loyalty_points: 0, registration_date: new Date().toISOString(), last_visit: new Date().toISOString(), avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name.split(' ')[0]}` };
    const newCustomer = await CustomerEntity.create(c.env, newCustomerData);
    await NotificationEntity.create(c.env, { id: crypto.randomUUID(), customer_id: newCustomer.id, type: 'registration', message: `Welcome to Salt N Bite, ${name}!`, status: 'queued' });
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
  app.get('/api/promos', async (c) => ok(c, (await PromoEntity.list(c.env)).items));
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
    console.log(`[AUDIT] Reservation created for ${customer.name}`);
    return ok(c, reservation);
  });
  app.get('/api/reservations/upcoming', async (c) => {
    const date = c.req.query('date');
    if (!date) return bad(c, 'Date query parameter is required');
    const all = (await ReservationEntity.list(c.env)).items;
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
}
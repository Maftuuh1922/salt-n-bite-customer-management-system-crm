import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import { CustomerEntity, TransactionEntity, PromoEntity, ReservationEntity, FeedbackEntity, LoyaltyEventEntity, NotificationEntity } from './entities';
import type { Customer, DashboardStats, Transaction, Reservation, Feedback, Notification, AggregatedReport, ReportType } from "@shared/types";
import { subDays, format, parseISO, isWithinInterval } from 'date-fns';
// Middleware for seeding data on first request
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/*', seedMiddleware);
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
    const customers = await CustomerEntity.list(c.env);
    return ok(c, customers.items);
  });
  app.get('/api/customers/:id', async (c) => {
    const id = c.req.param('id');
    const customer = new CustomerEntity(c.env, id);
    if (!(await customer.exists())) return notFound(c, 'Customer not found');
    return ok(c, await customer.getState());
  });
  app.get('/api/customers/:id/transactions', async (c) => {
    const id = c.req.param('id');
    const allTransactions = await TransactionEntity.list(c.env);
    const customerTransactions = allTransactions.items.filter(t => t.customer_id === id);
    return ok(c, customerTransactions);
  });
  app.post('/api/customers/register', async (c) => {
    const { phone_number, name, email } = await c.req.json<{ phone_number: string, name: string, email?: string }>();
    if (!isStr(phone_number) || !isStr(name)) return bad(c, 'Phone number and name are required');
    const allCustomers = await CustomerEntity.list(c.env);
    let customer = allCustomers.items.find(cust => cust.phone_number === phone_number);
    if (customer) {
      return ok(c, { ...customer, existed: true });
    }
    const newCustomerData: Customer = {
      id: crypto.randomUUID(),
      phone_number,
      name,
      email,
      membership_level: 'Bronze',
      total_visits: 1,
      total_spent: 0,
      loyalty_points: 0,
      registration_date: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name.split(' ')[0]}`,
    };
    const newCustomer = await CustomerEntity.create(c.env, newCustomerData);
    return ok(c, { ...newCustomer, existed: false });
  });
  // TRANSACTIONS
  app.post('/api/transactions/sync', async (c) => {
    const { pos_transaction_id, customer_id, total_amount, items, payment_method } = await c.req.json<Partial<Transaction>>();
    if (!pos_transaction_id) return bad(c, 'pos_transaction_id is required');
    const allTransactions = await TransactionEntity.list(c.env);
    if (allTransactions.items.some(t => t.pos_transaction_id === pos_transaction_id)) {
      return ok(c, { message: 'Transaction already synced', pos_transaction_id });
    }
    const newTransactionData: Transaction = {
      id: crypto.randomUUID(),
      pos_transaction_id,
      customer_id: customer_id || 'cust_anonymous',
      total_amount: total_amount || 0,
      transaction_date: new Date().toISOString(),
      payment_method: payment_method || 'Cash',
      loyalty_points_earned: Math.floor((total_amount || 0) / 10000),
      items: items || [],
    };
    const newTransaction = await TransactionEntity.create(c.env, newTransactionData);
    if (customer_id && customer_id !== 'cust_anonymous') {
      const customer = new CustomerEntity(c.env, customer_id);
      if (await customer.exists()) {
        await customer.mutate(s => ({
          ...s,
          total_visits: s.total_visits + 1,
          total_spent: s.total_spent + (total_amount || 0),
          loyalty_points: s.loyalty_points + newTransaction.loyalty_points_earned,
          last_visit: newTransaction.transaction_date,
        }));
      }
    }
    return ok(c, newTransaction);
  });
  // PROMOS
  app.get('/api/promos/active', async (c) => {
    const promos = await PromoEntity.list(c.env);
    const activePromos = promos.items.filter(p => p.is_active);
    return ok(c, activePromos);
  });
  // LOYALTY
  app.post('/api/loyalty/calculate', async (c) => {
    const { total_amount } = await c.req.json<{ total_amount: number }>();
    if (typeof total_amount !== 'number') return bad(c, 'total_amount is required');
    const points = Math.floor(total_amount / 10000);
    return ok(c, { points_earned: points });
  });
  // RESERVATIONS
  app.post('/api/reservations', async (c) => {
    const { customer_id, reservation_date, number_of_guests } = await c.req.json<Partial<Reservation>>();
    if (!customer_id || !reservation_date || !number_of_guests) return bad(c, 'Missing required fields');
    const newReservationData: Reservation = {
      id: crypto.randomUUID(),
      customer_id,
      reservation_date,
      number_of_guests,
      status: 'confirmed',
    };
    const newReservation = await ReservationEntity.create(c.env, newReservationData);
    return ok(c, newReservation);
  });
  // FEEDBACK
  app.post('/api/feedback', async (c) => {
    const { customer_id, transaction_id, rating, comment } = await c.req.json<Partial<Feedback>>();
    if (!customer_id || !transaction_id || rating === undefined) return bad(c, 'Missing required fields');
    const newFeedbackData: Feedback = {
      id: crypto.randomUUID(),
      customer_id,
      transaction_id,
      rating,
      comment: comment || '',
      feedback_date: new Date().toISOString(),
    };
    const newFeedback = await FeedbackEntity.create(c.env, newFeedbackData);
    return ok(c, newFeedback);
  });
  // NOTIFICATIONS
  app.post('/api/notifications/whatsapp', async (c) => {
    const { customer_id, type, message } = await c.req.json<Partial<Notification>>();
    if (!customer_id || !type || !message) return bad(c, 'Missing required fields');
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      customer_id,
      type,
      message,
      status: 'queued',
    };
    await NotificationEntity.create(c.env, newNotification);
    console.log(`[WhatsApp Mock] Queued message for ${customer_id}: "${message}"`);
    return ok(c, { message: 'Notification queued successfully' });
  });
  // REPORTING
  app.get('/api/reports/:type', async (c) => {
    const type = c.req.param('type') as ReportType;
    const { start, end } = c.req.query();
    if (!start || !end) return bad(c, 'Start and end dates are required');
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const transactions = (await TransactionEntity.list(c.env)).items.filter(t =>
      isWithinInterval(parseISO(t.transaction_date), { start: startDate, end: endDate })
    );
    let report: AggregatedReport;
    switch (type) {
      case 'customer-activity':
        const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
        const activityByDate = transactions.reduce((acc, t) => {
          const date = format(parseISO(t.transaction_date), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        report = {
          type,
          period: { start, end },
          metrics: { total: transactions.length, totalRevenue },
          data: Object.entries(activityByDate).map(([date, visits]) => ({ date, visits })),
        };
        break;
      default:
        return notFound(c, 'Report type not found');
    }
    return ok(c, report);
  });
}
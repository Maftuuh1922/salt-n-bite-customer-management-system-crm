import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import { CustomerEntity, TransactionEntity, PromoEntity, ReservationEntity, FeedbackEntity, LoyaltyEventEntity, NotificationEntity } from './entities';
import type { Customer, DashboardStats, Transaction, Reservation, Feedback, Notification, AggregatedReport, ReportType, CustomerGroup, MembershipLevel } from "@shared/types";
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
// Mock Auth Middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return bad(c, 'Unauthorized: Missing token', 401);
  }
  const token = authHeader.replace('Bearer ', '');
  // In a real app, you'd verify a JWT. Here, we mock it.
  if (token === 'demo-admin-jwt') {
    c.set('role', 'admin');
  } else {
    return bad(c, 'Unauthorized: Invalid token', 401);
  }
  await next();
};
const encrypt = (str: string | undefined) => str ? btoa(str) : undefined;
const decrypt = (str: string | undefined) => str ? atob(str) : undefined;
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/*', seedMiddleware);
  app.use('/api/dashboard/*', authMiddleware);
  app.use('/api/customers/*', authMiddleware);
  app.use('/api/promos/*', authMiddleware);
  app.use('/api/reservations/*', authMiddleware);
  app.use('/api/reports/*', authMiddleware);
  app.use('/api/notifications/*', authMiddleware);
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
  app.get('/api/customers/group', async (c) => {
    const customers = (await CustomerEntity.list(c.env)).items;
    const groups: Record<MembershipLevel, { count: number; total_spent: number }> = {
      Bronze: { count: 0, total_spent: 0 },
      Silver: { count: 0, total_spent: 0 },
      Gold: { count: 0, total_spent: 0 },
      Platinum: { count: 0, total_spent: 0 },
    };
    customers.forEach(c => {
      groups[c.membership_level].count++;
      groups[c.membership_level].total_spent += c.total_spent;
    });
    const result: CustomerGroup[] = Object.entries(groups).map(([level, data]) => ({
      level: level as MembershipLevel,
      ...data,
    }));
    return ok(c, result);
  });
  app.get('/api/customers/:id', async (c) => {
    const id = c.req.param('id');
    const customer = new CustomerEntity(c.env, id);
    if (!(await customer.exists())) return notFound(c, 'Customer not found');
    const state = await customer.getState();
    return ok(c, { ...state, phone_number: encrypt(state.phone_number), email: encrypt(state.email) });
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
      phone_number, name, email,
      membership_level: 'Bronze', total_visits: 1, total_spent: 0, loyalty_points: 0,
      registration_date: new Date().toISOString(), last_visit: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name.split(' ')[0]}`,
    };
    const newCustomer = await CustomerEntity.create(c.env, newCustomerData);
    // Trigger mock WhatsApp notification
    const welcomeMessage: Notification = {
      id: crypto.randomUUID(), customer_id: newCustomer.id, type: 'registration',
      message: `Welcome to Salt N Bite, ${name}! We're glad to have you.`, status: 'queued',
    };
    await NotificationEntity.create(c.env, welcomeMessage);
    console.log(`[AUDIT] New customer registered: ${name}. Queued welcome message.`);
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
      id: crypto.randomUUID(), pos_transaction_id,
      customer_id: customer_id || 'cust_anonymous', total_amount: total_amount || 0,
      transaction_date: new Date().toISOString(), payment_method: payment_method || 'Cash',
      loyalty_points_earned: Math.floor((total_amount || 0) / 10000), items: items || [],
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
  // PROMOS, RESERVATIONS, FEEDBACK, LOYALTY (Stubs from previous phase, assumed correct)
  app.get('/api/promos/active', async (c) => ok(c, (await PromoEntity.list(c.env)).items.filter(p => p.is_active)));
  app.post('/api/reservations', async (c) => ok(c, {}));
  app.post('/api/feedback', async (c) => ok(c, {}));
  app.post('/api/loyalty/calculate', async (c) => ok(c, {}));
  app.post('/api/notifications/whatsapp', async (c) => ok(c, {}));
  // REPORTING
  app.get('/api/reports/:type', async (c) => {
    const role = c.get('role');
    if (role !== 'admin' && role !== 'manager') {
      return bad(c, 'Forbidden', 403);
    }
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
      case 'customer-activity': {
        const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
        const activityByDate = transactions.reduce((acc, t) => {
          const date = format(parseISO(t.transaction_date), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        report = {
          type, period: { start, end },
          metrics: { total: transactions.length, totalRevenue },
          data: Object.entries(activityByDate).map(([date, visits]) => ({ date, visits })),
        };
        break;
      }
      case 'promo-effectiveness': {
        const promos = (await PromoEntity.list(c.env)).items;
        const promoTxns = transactions.filter(t => t.promo_id);
        const promoData = promos.map(p => {
          const redemptions = promoTxns.filter(t => t.promo_id === p.id);
          return {
            promo_name: p.promo_name,
            redemptions: redemptions.length,
            revenue: redemptions.reduce((sum, t) => sum + t.total_amount, 0),
          };
        });
        report = {
          type, period: { start, end },
          metrics: { total: promoTxns.length },
          data: promoData,
        };
        break;
      }
      case 'loyalty-usage': {
        const earned = transactions.reduce((sum, t) => sum + t.loyalty_points_earned, 0);
        const spent = transactions.reduce((sum, t) => sum + (t.loyalty_points_used || 0), 0);
        report = {
          type, period: { start, end },
          metrics: { total: earned - spent },
          data: [{ type: 'Earned', points: earned }, { type: 'Spent', points: spent }],
        };
        break;
      }
      case 'feedback': {
        const feedbacks = (await FeedbackEntity.list(c.env)).items.filter(f =>
          isWithinInterval(parseISO(f.feedback_date), { start: startDate, end: endDate })
        );
        const avgRating = feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length : 0;
        const ratingCounts = feedbacks.reduce((acc, f) => {
          acc[f.rating] = (acc[f.rating] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
        report = {
          type, period: { start, end },
          metrics: { total: feedbacks.length, avg: avgRating },
          data: Object.entries(ratingCounts).map(([rating, count]) => ({ rating: Number(rating), count })),
        };
        break;
      }
      default:
        return notFound(c, 'Report type not found');
    }
    console.log(`[AUDIT] Report generated by role '${role}': ${type}`);
    return ok(c, report);
  });
}
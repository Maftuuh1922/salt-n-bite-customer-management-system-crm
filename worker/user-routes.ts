import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS, MOCK_PROMOS, MOCK_RESERVATIONS, MOCK_FEEDBACK } from '@shared/mock-data';
import type { Customer, DashboardStats, Transaction } from "@shared/types";
import { subDays, format } from 'date-fns';
// In-memory store for demo purposes to handle idempotency and new data
const posTransactionIds = new Set(MOCK_TRANSACTIONS.map(t => t.pos_transaction_id));
let customers = [...MOCK_CUSTOMERS];
let transactions = [...MOCK_TRANSACTIONS];
let promos = [...MOCK_PROMOS];
let reservations = [...MOCK_RESERVATIONS];
let feedback = [...MOCK_FEEDBACK];
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // DASHBOARD
  app.get('/api/dashboard/stats', (c) => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const customerActivity = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'MMM d'),
        visits: Math.floor(Math.random() * 20) + 5, // Random data for chart
      };
    }).reverse();
    const stats: DashboardStats = {
      totalCustomers: customers.length,
      todaysVisits: Math.floor(Math.random() * 30) + 10,
      activePromos: promos.filter(p => p.is_active).length,
      totalRevenue,
      customerActivity,
      topCustomers: [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5),
      recentTransactions: [...transactions].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 5),
    };
    return ok(c, stats);
  });
  // CUSTOMERS
  app.get('/api/customers', (c) => {
    return ok(c, customers);
  });
  app.get('/api/customers/:id', (c) => {
    const id = c.req.param('id');
    const customer = customers.find(cust => cust.id === id);
    return customer ? ok(c, customer) : notFound(c, 'Customer not found');
  });
  app.get('/api/customers/:id/transactions', (c) => {
    const id = c.req.param('id');
    const customerTransactions = transactions.filter(t => t.customer_id === id);
    return ok(c, customerTransactions);
  });
  app.post('/api/customers/register', async (c) => {
    const { phone_number, name, email } = await c.req.json<{ phone_number: string, name: string, email?: string }>();
    if (!isStr(phone_number) || !isStr(name)) return bad(c, 'Phone number and name are required');
    let customer = customers.find(cust => cust.phone_number === phone_number);
    if (customer) {
      return ok(c, { ...customer, existed: true });
    }
    const newCustomer: Customer = {
      id: `cust_${customers.length + 1}`,
      phone_number,
      name,
      email,
      membership_level: 'Bronze',
      total_visits: 0,
      total_spent: 0,
      loyalty_points: 0,
      registration_date: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${name.split(' ')[0]}`,
    };
    customers.push(newCustomer);
    return ok(c, { ...newCustomer, existed: false });
  });
  // TRANSACTIONS
  app.post('/api/transactions/sync', async (c) => {
    const { pos_transaction_id, customer_id, total_amount } = await c.req.json<Partial<Transaction>>();
    if (!pos_transaction_id) return bad(c, 'pos_transaction_id is required');
    // Idempotency check
    if (posTransactionIds.has(pos_transaction_id)) {
      return ok(c, { message: 'Transaction already synced', pos_transaction_id });
    }
    const newTransaction: Transaction = {
      id: `txn_${transactions.length + 1}`,
      pos_transaction_id,
      customer_id: customer_id || 'cust_anonymous',
      total_amount: total_amount || 0,
      transaction_date: new Date().toISOString(),
      payment_method: 'Cash',
      loyalty_points_earned: Math.floor((total_amount || 0) / 10000),
      items: [],
    };
    transactions.push(newTransaction);
    posTransactionIds.add(pos_transaction_id);
    // Update customer stats
    const customer = customers.find(cust => cust.id === customer_id);
    if (customer) {
      customer.total_visits += 1;
      customer.total_spent += total_amount || 0;
      customer.loyalty_points += newTransaction.loyalty_points_earned;
      customer.last_visit = newTransaction.transaction_date;
    }
    return ok(c, newTransaction);
  });
  // PROMOS
  app.get('/api/promos/active', (c) => {
    const activePromos = promos.filter(p => p.is_active);
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
    const { customer_id, reservation_date, number_of_guests } = await c.req.json();
    const newReservation = {
      id: `res_${reservations.length + 1}`,
      customer_id,
      reservation_date,
      number_of_guests,
      status: 'confirmed',
    };
    reservations.push(newReservation);
    return ok(c, newReservation);
  });
  // FEEDBACK
  app.post('/api/feedback', async (c) => {
    const { customer_id, transaction_id, rating, comment } = await c.req.json();
    const newFeedback = {
      id: `fb_${feedback.length + 1}`,
      customer_id,
      transaction_id,
      rating,
      comment,
      feedback_date: new Date().toISOString(),
    };
    feedback.push(newFeedback);
    return ok(c, newFeedback);
  });
}
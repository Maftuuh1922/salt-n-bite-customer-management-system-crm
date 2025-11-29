export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type MembershipLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export interface Customer {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  membership_level: MembershipLevel;
  total_visits: number;
  total_spent: number;
  loyalty_points: number;
  registration_date: string;
  last_visit: string;
  avatarUrl?: string;
}
export interface Transaction {
  id: string;
  customer_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: 'Credit Card' | 'Cash' | 'Digital Wallet';
  loyalty_points_earned: number;
  pos_transaction_id: string;
  items: { name: string; quantity: number; price: number }[];
}
export interface Promo {
  id: string;
  promo_name: string;
  promo_type: 'event' | 'birthday' | 'membership';
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
export interface Reservation {
  id: string;
  customer_id: string;
  reservation_date: string;
  number_of_guests: number;
  status: 'confirmed' | 'completed' | 'cancelled';
}
export interface Feedback {
  id: string;
  customer_id: string;
  transaction_id: string;
  rating: number;
  comment: string;
  feedback_date: string;
}
export interface LoyaltyEvent {
  id: string;
  event_name: string;
  points_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
export interface DashboardStats {
  totalCustomers: number;
  todaysVisits: number;
  activePromos: number;
  totalRevenue: number;
  customerActivity: { date: string; visits: number }[];
  topCustomers: Customer[];
  recentTransactions: Transaction[];
}
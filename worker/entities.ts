import { IndexedEntity } from "./core-utils";
import type { Customer, Transaction, Promo, Reservation, Feedback, LoyaltyEvent, MembershipLevel } from "@shared/types";
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS, MOCK_PROMOS, MOCK_RESERVATIONS, MOCK_FEEDBACK, MOCK_LOYALTY_EVENTS } from "@shared/mock-data";
// CUSTOMER ENTITY
export class CustomerEntity extends IndexedEntity<Customer> {
  static readonly entityName = "customer";
  static readonly indexName = "customers";
  static readonly initialState: Customer = {
    id: "",
    phone_number: "",
    name: "",
    email: "",
    membership_level: 'Bronze',
    total_visits: 0,
    total_spent: 0,
    loyalty_points: 0,
    registration_date: "",
    last_visit: "",
  };
  static seedData = MOCK_CUSTOMERS;
}
// TRANSACTION ENTITY
export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = {
    id: "",
    customer_id: "",
    transaction_date: "",
    total_amount: 0,
    payment_method: 'Cash',
    loyalty_points_earned: 0,
    pos_transaction_id: "",
    items: [],
  };
  static seedData = MOCK_TRANSACTIONS;
}
// PROMO ENTITY
export class PromoEntity extends IndexedEntity<Promo> {
  static readonly entityName = "promo";
  static readonly indexName = "promos";
  static readonly initialState: Promo = {
    id: "",
    promo_name: "",
    promo_type: 'event',
    description: "",
    start_date: "",
    end_date: "",
    is_active: false,
  };
  static seedData = MOCK_PROMOS;
}
// RESERVATION ENTITY
export class ReservationEntity extends IndexedEntity<Reservation> {
  static readonly entityName = "reservation";
  static readonly indexName = "reservations";
  static readonly initialState: Reservation = {
    id: "",
    customer_id: "",
    reservation_date: "",
    number_of_guests: 0,
    status: 'confirmed',
  };
  static seedData = MOCK_RESERVATIONS;
}
// FEEDBACK ENTITY
export class FeedbackEntity extends IndexedEntity<Feedback> {
  static readonly entityName = "feedback";
  static readonly indexName = "feedbacks";
  static readonly initialState: Feedback = {
    id: "",
    customer_id: "",
    transaction_id: "",
    rating: 0,
    comment: "",
    feedback_date: "",
  };
  static seedData = MOCK_FEEDBACK;
}
// LOYALTY EVENT ENTITY
export class LoyaltyEventEntity extends IndexedEntity<LoyaltyEvent> {
  static readonly entityName = "loyalty_event";
  static readonly indexName = "loyalty_events";
  static readonly initialState: LoyaltyEvent = {
    id: "",
    event_name: "",
    points_multiplier: 1,
    start_date: "",
    end_date: "",
    is_active: false,
  };
  static seedData = MOCK_LOYALTY_EVENTS;
}
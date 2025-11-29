# Salt N Bite — Customer Management System (CRM)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Maftuuh1922/salt-n-bite-customer-management-system-crm)

## Overview

Salt N Bite CRM is a polished, production-grade customer management system designed for quick-service restaurants. It centralizes customer auto-registration (triggered from POS or reservations using phone number as the unique identifier), event-based loyalty programs, real-time promotional displays, transaction history, reservation synchronization, POS integration, customer feedback, membership grouping, and automated reporting. Built on an edge-first architecture with Cloudflare Workers and a React frontend, the system ensures sub-second responses, scalability for 1000+ concurrent users, and seamless integrations with POS, reservation, and accounting systems.

The application follows a mobile-first, responsive design with a modern warm-toned theme (orange, cream, brown accents) and subtle batik patterns, ensuring WCAG 2.1 AA accessibility compliance.

## Key Features

- **Customer Auto-Registration (FR-01)**: Automatically registers customers via phone number during reservations or transactions.
- **Event-Based Loyalty (FR-02)**: Activates loyalty points only during specific events, with automatic calculation from transactions.
- **Promo Display (FR-03)**: Real-time promotion visibility for registered customers.
- **Transaction History (FR-04)**: Detailed logs including menus, amounts, and payment methods.
- **Reservation Sync (FR-05)**: Automatic linking of reservation data to customer profiles.
- **POS Integration (FR-06)**: Real-time synchronization of transactions and loyalty points via API webhooks.
- **Customer Feedback (FR-07)**: Post-transaction rating and comments.
- **Customer Dashboard (FR-08)**: Real-time stats on visits, transactions, points, and activity.
- **Membership Grouping (FR-09)**: Customer segmentation based on transaction history.
- **Reporting Module (FR-10)**: Automated reports on customer activity, promo effectiveness, and loyalty usage.

**Integrations**: POS (real-time webhooks), Reservation System (API sync), Accounting (scheduled batches), WhatsApp (event-triggered notifications).

**Business Rules**: Unique phone-based identity, event-limited loyalty, encrypted data (AES-256), automatic transaction logging.

**Non-Functional**: <3s dashboard loads, 99% uptime, scalable to 1000+ users, real-time sync latency <1s.

## Tech Stack

- **Frontend**: React 18, React Router 6, TypeScript, shadcn/ui, Tailwind CSS v3, Framer Motion (micro-interactions), Recharts (visualizations), React Hook Form + Zod (forms/validation), Zustand (state management), Sonner (toasts), Lucide React (icons).
- **Backend**: Hono (routing), Cloudflare Workers (edge runtime), Global Durable Objects (persistent storage with atomic updates).
- **Database**: In-memory IndexedEntity pattern via Durable Objects (SQLite-backed for migrations).
- **API**: RESTful endpoints with JWT authentication (Phase 2+), ApiResponse format for type safety.
- **Tools**: Vite (build), Bun (package manager), Wrangler (deployment), Date-fns (dates), UUID (IDs).
- **Security**: HTTPS enforced, data encryption at rest/transit, role-based access (Admin, Staff, Manager, Customer).

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun 1.0+ for faster installs).
- Cloudflare account (free tier sufficient for development).
- Wrangler CLI: Install via `bun install -g wrangler`.

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd salt-n-bite-crm
   ```

2. Install dependencies using Bun:
   ```
   bun install
   ```

3. Generate Cloudflare types (one-time):
   ```
   bun run cf-typegen
   ```

### Running Locally

1. Start the development server:
   ```
   bun run dev
   ```

   The app will be available at `http://localhost:3000` (or the port specified in your environment).

2. In a separate terminal, deploy and tunnel the Worker for full-stack testing:
   ```
   bun run deploy
   ```

   Access APIs at your Worker URL (e.g., `https://salt-n-bite-crm.your-subdomain.workers.dev`).

Test the demo: Visit the homepage for a visual foundation, then navigate to Dashboard, Customer Profile, etc., to interact with mock APIs.

## Usage

### Pages and Flows

- **Home/Hero**: Marketing overview with KPIs (total customers, active members, visits).
- **Dashboard**: KPI cards, activity charts, top customers table, recent transactions (use date filters).
- **Customer Profile**: View/edit profile, membership badge, loyalty points, paginated transactions, reservations, feedback (actions: adjust points, send promo).
- **Promo Management**: List active promos, create/edit via modal, calendar view, performance stats.
- **Reservation Management**: Calendar with availability, customer search, form for new reservations (auto-links by phone).
- **Reporting**: Select report type (activity, promo effectiveness), date range, preview with charts, export PDF/Excel.

### API Endpoints

All endpoints follow RESTful patterns at `/api/*`. Examples (using fetch or api-client.ts):

- Register customer: `POST /api/customers/register { phone_number: '+1234567890', ... }`
- Get profile: `GET /api/customers/{id}`
- Sync transaction: `POST /api/transactions/sync { pos_transaction_id: 'tx123', ... }`
- Active promos: `GET /api/promos/active`
- Dashboard stats: `GET /api/dashboard/stats`
- Generate report: `GET /api/reports/customer-activity?start=2023-01-01&end=2023-12-31`

Mock data is seeded in `shared/mock-data.ts`; real persistence uses entities in `worker/entities.ts`.

### Example: Creating a Customer (Frontend)

```tsx
import { api } from '@/lib/api-client';

const createCustomer = async (data: { phone_number: string; name?: string }) => {
  try {
    const customer = await api('/api/customers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Customer registered');
    return customer;
  } catch (error) {
    toast.error('Registration failed');
  }
};
```

## Development

### Project Structure

- `src/`: React frontend (pages, components, hooks, lib).
- `worker/`: Hono backend (routes in `user-routes.ts`, entities in `entities.ts`).
- `shared/`: TypeScript types and mock data.
- `tailwind.config.js`: Custom theme (extend for colors: #F38020 primary, #F9E9D2 background, #6B4226 accent).

### Adding Features

1. **Frontend Pages**: Add routes in `src/main.tsx` using React Router. Wrap with `AppLayout` for sidebar.
2. **API Routes**: Extend `worker/user-routes.ts` using helpers (`ok`, `bad`) and entities (e.g., `CustomerEntity.create(env, data)`).
3. **Entities**: Define new IndexedEntity classes in `worker/entities.ts` (e.g., `CustomerEntity` with schema fields).
4. **State Management**: Use Zustand with primitive selectors (e.g., `useStore(s => s.count)`).
5. **UI Components**: Leverage shadcn/ui (import from `@/components/ui/*`). Ensure responsive wrappers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with `py-8 md:py-10 lg:py-12`.
6. **Visual Polish**: Apply micro-interactions (Framer Motion), hover states, and loading skeletons.

Lint and type-check: `bun run lint`. Build: `bun run build`.

### Common Patterns

- **API Calls**: Use `src/lib/api-client.ts` for typed requests.
- **Error Handling**: Global `ErrorBoundary` and `RouteErrorBoundary` catch issues; report via `/api/client-errors`.
- **Theming**: Toggle dark/light mode with `useTheme` hook.
- **Infinite Loops Prevention**: Follow strict rules—no setState in render, primitive Zustand selectors only.

## Deployment

Deploy to Cloudflare Workers for edge-global performance. No servers needed.

1. Login to Wrangler:
   ```
   wrangler login
   ```

2. Configure secrets (e.g., JWT keys, integration webhooks) if needed:
   ```
   wrangler secret put API_SECRET
   ```

3. Deploy:
   ```
   bun run deploy
   ```

   This builds the frontend (static assets served via Workers Sites) and deploys the Worker. Your app will be live at `<project-name>.<subdomain>.workers.dev`.

For production:
- Set custom domain in Wrangler dashboard.
- Enable analytics engine for observability.
- Migrate to external DB (MySQL/PostgreSQL) if scaling beyond Durable Objects.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Maftuuh1922/salt-n-bite-customer-management-system-crm)

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feature/new-promo`).
2. Commit changes (`git commit -m 'Add promo management'`).
3. Push to branch (`git push origin feature/new-promo`).
4. Open a Pull Request.

Follow the code style (ESLint, Prettier via `bun run lint`). Focus on visual excellence, error-free code, and no infinite loops.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ for Salt N Bite. Questions? Open an issue!
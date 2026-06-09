# EnerSource ERP

Office Management & ERP platform for solar companies — built with **React**, **TypeScript**, **Node.js**, **SQLite** (development), and **PostgreSQL** (production).

**Brand:** EnerSource Inc · Logo and crimson (`#c61b2e`) theme applied across login, sidebar, and UI accents.

**Deploy:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Render (API) + Vercel (frontend)

## Phase 11 (Complete)

- Centralized Reports & BI hub with role-specific KPI dashboards
- Financial and operational report bundles with module deep links
- 6-month revenue trend charts and CSV executive summary export
- Optional Power BI embed via `POWER_BI_EMBED_URL`

## Phase 10 (Complete)

- Asset registry with straight-line depreciation and book values
- Internal & customer support tickets with comments and status workflow

## Phase 9 (Complete)

- Staff messaging — department channels, announcements, general discussion
- Document archive with categories, uploads, and version history

## Phase 8 (Complete)

- Employee directory with departments and managers
- Attendance records, KPI tracking, performance appraisals

## Phase 7 (Complete)

- Leads with pipeline stages and estimated value
- Sales pipeline board, client directory, activity log
- Follow-up reminders and lead-to-client conversion

## Phase 6 (Complete)

- Solar installation, maintenance, and engineering projects
- Tasks, milestones, budget vs actual cost tracking
- Material usage with optional inventory issue from MAIN warehouse
- Project dashboard KPIs (active, delayed, budget performance)

## Phase 5 (Complete)

- Purchase requisitions with multi-step approvals
- Payment requests (pending/approved/rejected/paid) + uploads
- Petty cash float, expenses, reconciliation reports

## Phase 4 (Complete)

- Multi-warehouse stock (panels, batteries, inverters, etc.)
- Receipts, issues, adjustments, transfers
- Real-time valuation and low-stock alerts
- Inventory reports

## Phase 3 (Complete)

- Customers, quotations, sales orders, contracts
- Invoices (draft/sent/paid/overdue/cancelled), payments, email-ready send tracking
- AR aging report, AP vendor bills
- Sales KPI dashboard

## Phase 2 (Complete)

- Chart of Accounts (26 default solar-industry accounts, import, CRUD)
- General Journal with approval workflow (draft → pending → posted)
- Journal reversal and audit trail
- General Ledger with period filters and drill-down
- Trial Balance with balance validation
- Income Statement, Balance Sheet, Cash Flow reports
- CSV export for ledger and trial balance

## Phase 1 (Complete)

- Secure login / logout with JWT + refresh tokens
- Multi-factor authentication (TOTP / authenticator app)
- Password policies and account lockout
- Role-based access control (11 roles, department scoping)
- User & profile management (admin)
- Audit logging foundation
- Notifications API
- Responsive UI: sidebar, dashboard, mobile touch targets, transitions

## Quick Start

```bash
# From project root
npm install
cp server/.env.example server/.env   # if .env missing

cd server && npx prisma migrate dev --name init && npm run db:seed
cd ..

npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:4000/api/health  

### Default admin (after seed)

| Field    | Value                      |
|----------|----------------------------|
| Email    | `admin@enersource.local`   |
| Password | `Admin@Enersource2026!`    |

### Demo role accounts (after seed)

All demo accounts use password **`Demo@Enersource2026!`**

| Role | Email |
|------|-------|
| Super Administrator | `admin@enersource.local` (see above) |
| Managing Director | `director@enersource.local` |
| Finance Manager | `finance@enersource.local` |
| Accountant | `accountant@enersource.local` |
| Procurement Officer | `procurement@enersource.local` |
| HR Manager | `hr@enersource.local` |
| Inventory Officer | `inventory@enersource.local` |
| Project Manager | `projects@enersource.local` |
| Sales Officer | `sales@enersource.local` |
| Customer Support | `support@enersource.local` |
| Staff User | `staff@enersource.local` |

Change this password immediately in production.

## PostgreSQL (Production)

1. Create a PostgreSQL database.
2. In `server/prisma/schema.prisma`, set `provider = "postgresql"`.
3. Set `DATABASE_URL=postgresql://user:pass@host:5432/enersource_erp` in `.env`.
4. Run `npx prisma migrate deploy` and `npm run db:seed`.

See `server/prisma/schema.postgresql.prisma` for reference.

## Project Structure

```
Enersource_System/
├── client/          # React + Vite + Tailwind
├── server/          # Express + Prisma API
├── docs/            # Phase plan, manuals
└── package.json     # Workspace scripts
```

## Development Roadmap

| Phase | Module                          | Status      |
|-------|---------------------------------|-------------|
| 1     | Auth, RBAC, Users, UI shell     | ✅ Complete |
| 2     | Financial Management            | ✅ Complete |
| 3     | Sales & Revenue                 | ✅ Complete |
| 4     | Inventory                       | ✅ Complete |
| 5     | Procurement & Petty Cash        | ✅ Complete |
| 6     | Project Management              | ✅ Complete |
| 7     | CRM                             | ✅ Complete |
| 8     | Human Resources                 | ✅ Complete |
| 9     | Communication & Documents       | ✅ Complete |
| 10    | Assets & Support Tickets        | ✅ Complete |
| 11    | Reporting & BI                  | ✅ Complete |

Details: [docs/PHASES.md](docs/PHASES.md)

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | API + frontend concurrently    |
| `npm run build`   | Production build               |
| `npm run db:seed` | Seed roles, admin, sample COA  |
| `npm run db:studio` | Prisma Studio              |

## Security Notes

- Use strong `JWT_SECRET` / `JWT_REFRESH_SECRET` in production.
- Enable HTTPS and MFA for privileged accounts.
- SQLite is for local dev only; use PostgreSQL in production.

## License

Proprietary — Enersource Solar Company.

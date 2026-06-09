# Enersource ERP — Administrator Guide (Phase 1)

## Initial Setup

1. Configure `server/.env` (see `.env.example`).
2. Run database migrations and seed: `npm run db:migrate` and `npm run db:seed`.
3. Sign in as the seeded super admin and change the default password.
4. Enable MFA on the admin account before go-live.

## Creating Users

1. Navigate to **User Management**.
2. Click **Add User** and assign a role and department.
3. Provide a temporary password meeting policy requirements; users should change it on first login.

## Roles

| Role | Typical access |
|------|----------------|
| Super Administrator | Full system |
| Managing Director | Executive modules, reports |
| Finance Manager | Finance, sales, procurement |
| Accountant | Finance, petty cash |
| Procurement Officer | Procurement, inventory |
| HR Manager | HR module |
| Inventory Officer | Inventory, procurement |
| Project Manager | Projects, inventory, CRM |
| Sales Officer | Sales, CRM |
| Customer Support | CRM, support, messaging |
| Staff / User | Dashboard, procurement submit, support |

Permissions are enforced on every API request.

## PostgreSQL Deployment

Switch Prisma `provider` to `postgresql`, set `DATABASE_URL`, run `prisma migrate deploy`, then seed.

## Backups

- **SQLite (dev):** copy `server/dev.db` regularly.
- **PostgreSQL:** configure daily automated backups and weekly full backups per your DR policy.

## Audit

All logins, user changes, and module actions are written to `AuditLog`. Super administrators and managing directors can review events at **Audit Trail** (`/audit`) with search and entity-type filters.

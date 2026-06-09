# EnerSource ERP

Office Management & ERP platform for solar companies — built with **React**, **TypeScript**, **Node.js**, **SQLite** (development), and **PostgreSQL** (production).


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

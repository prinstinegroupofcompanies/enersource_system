# Deployment Guide — EnerSource ERP

Production stack: **Render** (API + PostgreSQL) · **Vercel** (React frontend)

---

## 1. Backend on Render

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect the repo.
3. Render reads `render.yaml` and creates:
   - Web service `enersource-api`
   - PostgreSQL database `enersource-db`
4. Set **CLIENT_URL** on the web service to your Vercel URL, e.g.  
   `https://enersource.vercel.app`
5. After first deploy, open the **Shell** on the web service and seed once:
   ```bash
   npm run db:seed
   ```

### Option B — Manual web service

| Setting | Value |
|---------|--------|
| Root Directory | `server` |
| Build Command | `chmod +x scripts/render-build.sh && ./scripts/render-build.sh` |
| Start Command | `npm run start` |
| Health Check | `/api/health` |

**Environment variables**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | From linked Render Postgres |
| `JWT_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Long random string |
| `CLIENT_URL` | Your Vercel production URL |
| `PORT` | `10000` (Render default) or leave unset |

> First deploy uses `prisma db push` to create tables on PostgreSQL (SQLite migrations are not reused).

---

## 2. Frontend on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite** (auto-detected).
4. Add environment variable:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://enersource-api.onrender.com/api` |

5. Deploy. `vercel.json` handles SPA routing.

### Preview deployments

Add preview URLs to Render `CLIENT_URL` (comma-separated), or use your stable production Vercel URL only.

---

## 3. Post-deploy checklist

- [ ] API health: `GET https://<render-host>/api/health`
- [ ] Seed database (Render shell): `npm run db:seed`
- [ ] Login at Vercel URL with seeded admin credentials
- [ ] Change default admin password
- [ ] Enable MFA for privileged accounts
- [ ] Confirm file uploads path is writable on Render (ephemeral disk — use S3 for production files long-term)

---

## 4. Local vs production

| | Local | Production |
|---|--------|------------|
| Database | SQLite (`server/prisma/dev.db`) | PostgreSQL (Render) |
| API URL | `http://localhost:4000` (proxied via Vite) | Render web service |
| `VITE_API_URL` | Unset (uses `/api` proxy) | `https://…onrender.com/api` |
| `CLIENT_URL` | `http://localhost:5173` | Vercel URL |

---

## 5. Brand assets

Company logo: `assets/enersource_logo.jpeg` (copied to `client/public/` for the web app).

Primary brand color: `#c61b2e` (EnerSource logo crimson).

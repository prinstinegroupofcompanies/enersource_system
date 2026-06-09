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
4. Set **CLIENT_URL** on the web service to your Vercel URL:  
   `https://enersource-system-client.vercel.app`  
   (Vercel `*.vercel.app` origins are also allowed automatically.)
5. After first deploy, open the **Shell** on the web service and seed once:
   ```bash
   cd server && npx tsx prisma/seed.ts
   ```

### Option B — Manual web service

| Setting | Value |
|---------|--------|
| Root Directory | `server` |
| Build Command | `chmod +x scripts/render-build.sh && ./scripts/render-build.sh` |
| Start Command | `npm run start` |
| Health Check | `/api/health` |

> **Important:** Add env var `NPM_CONFIG_PRODUCTION=false` so Render installs TypeScript and `@types/*` during build. The build script installs from the monorepo root with dev dependencies.

**Environment variables**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | From linked Render Postgres |
| `JWT_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Long random string |
| `CLIENT_URL` | `https://enersource-system-client.vercel.app` |
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

> **Must include `/api`** — or set base URL only (`https://enersource-api.onrender.com`); the client auto-appends `/api`.

5. Deploy. `vercel.json` handles SPA routing.

### CORS / login errors

If the browser shows *"blocked by CORS policy"* or requests hit `/auth/login` instead of `/api/auth/login`:

1. **Vercel** — set `VITE_API_URL` to `https://enersource-api.onrender.com/api` and redeploy.
2. **Render** — set `CLIENT_URL` to `https://enersource-system-client.vercel.app` and redeploy.
3. **Database** — run seed in Render Shell (see §3) so login accounts exist.

### Preview deployments

Add preview URLs to Render `CLIENT_URL` (comma-separated), or use your stable production Vercel URL only.

---

## 3. Post-deploy checklist

- [ ] API health: `GET https://<render-host>/api/health`
- [ ] Seed database (Render shell): `cd server && npx tsx prisma/seed.ts`
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

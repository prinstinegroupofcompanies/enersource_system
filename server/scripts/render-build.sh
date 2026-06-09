#!/usr/bin/env bash
set -euo pipefail

# server/scripts → repo root
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER="${ROOT}/server"

echo "→ Installing monorepo dependencies (dev deps required for TypeScript build)…"
cd "${ROOT}"
# NODE_ENV=production on Render skips devDependencies — force include them
NODE_ENV=development npm install --include=dev

echo "→ Preparing Prisma for production…"
cd "${SERVER}"
if [[ "${DATABASE_URL:-}" == postgresql* ]]; then
  echo "  PostgreSQL detected — switching schema provider"
  sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  npx prisma generate
  echo "→ Pushing schema to PostgreSQL…"
  npx prisma db push --accept-data-loss
else
  echo "  SQLite / local — generate client only"
  npx prisma generate
fi

echo "→ Compiling TypeScript…"
npm run build

echo "✓ Render build complete"

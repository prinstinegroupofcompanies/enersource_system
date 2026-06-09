#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Installing server dependencies…"
npm install

echo "→ Preparing Prisma for production…"
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

#used in prod/staging only

#!/usr/bin/env bash
set -euo pipefail

PGHOST="${POSTGRES_HOST:-supabase-db}"
PGPORT_W="${POSTGRES_PORT:-5432}"

echo "[entrypoint] waiting for Postgres at ${PGHOST}:${PGPORT_W}..."
until nc -z "${PGHOST}" "${PGPORT_W}"; do
  sleep 1
done
echo "[entrypoint] Postgres up."

# Migrations only. NO db push fallback — data-loss risk.
# If no migrations exist, fail loud so operator knows to author them.
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] FATAL: prisma/migrations missing or empty."
  echo "[entrypoint] Author migrations in dev: docker compose run --rm app bunx prisma migrate dev --name init"
  exit 1
fi

echo "[entrypoint] running prisma migrate deploy..."
bunx prisma migrate deploy

if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ] || [ -f "prisma/seed.mjs" ]; then
  echo "[entrypoint] seeding..."
  bunx prisma db seed || echo "[entrypoint] seed failed (non-fatal)."
fi

echo "[entrypoint] starting app: $*"
exec "$@"

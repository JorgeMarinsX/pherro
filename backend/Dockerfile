# Pherro backend — PRODUCTION image (NestJS on Bun, no build step: Bun runs TS).
# Local dev never uses this file (dev = bind-mount + bun --watch, see docker-compose.yml).

FROM oven/bun:latest AS deps
WORKDIR /app

# --ignore-scripts: prisma generate runs explicitly below with the schema present.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:latest AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
# Pre-create so the named volume inherits bun ownership (else root-owned = EACCES).
RUN mkdir -p /app/uploads && chown bun:bun /app/uploads

USER bun
EXPOSE 3001
# Tenant-less request: fail-closed empty list, still 200 (no wget/curl in the bun image).
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD bun -e "const r = await fetch('http://127.0.0.1:3001/vehicles'); if (!r.ok) process.exit(1)"
# Migrations run as postgres (owner); the app itself stays on the RLS-bound app_runtime role.
CMD ["sh", "-c", "DATABASE_URL=\"$MIGRATE_DATABASE_URL\" bunx prisma migrate deploy && bun --bun run src/main.ts"]

# syntax=docker/dockerfile:1.7
#
# PRODUCTION Dockerfile. NOT used by local `docker compose up`.
# Local dev uses oven/bun:latest directly with source bind-mount + `bun dev` (HMR).
# This file is for the eventual Portainer/Traefik deploy. Keep around; revisit later.
#
# ---- deps ----
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile || bun install
RUN bunx prisma generate

# ---- build ----
FROM oven/bun:latest AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ---- runtime ----
FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends \
      netcat-openbsd ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bun", "run", ".output/server/index.mjs"]

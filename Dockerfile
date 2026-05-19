# syntax=docker/dockerfile:1.7
#
# PRODUCTION Dockerfile for the Nuxt frontend. NOT used by local `docker compose up`.
# Local dev uses oven/bun:latest directly with source bind-mount + `bun dev` (HMR).
# This file is for the eventual Portainer/Traefik deploy. Backend has its own Dockerfile (TBD).
#
# ---- deps ----
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

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
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1
CMD ["bun", "run", ".output/server/index.mjs"]

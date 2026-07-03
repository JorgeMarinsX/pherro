# syntax=docker/dockerfile:1.7
#
# PRODUCTION Dockerfile for the Nuxt frontend. NOT used by local `docker compose up`.
# Local dev uses oven/bun:latest directly with source bind-mount + `bun dev` (HMR).
# Deployed via docker-compose.prod.yml (Portainer + Traefik).

# ---- deps ----
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --ignore-scripts: postinstall (nuxt prepare) needs sources not copied yet.
RUN bun install --frozen-lockfile --ignore-scripts

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
COPY --from=build --chown=bun:bun /app/.output ./.output
USER bun
EXPOSE 3000
# /api/auth/me is host-independent and always 200 (no wget/curl in the bun image).
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD bun -e "const r = await fetch('http://127.0.0.1:3000/api/auth/me'); if (!r.ok) process.exit(1)"
CMD ["bun", ".output/server/index.mjs"]

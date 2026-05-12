# Pherro — Project Instructions

> Used-car dealership management system. Multi-tenant: each shop = isolated stack.
> Instructions in English. **All UI text in Brazilian Portuguese (pt-BR).**

---

## 1. Stack (non-negotiable)

| Layer | Tech | Notes |
|---|---|---|
| Runtime | **Bun** (`oven/bun:latest`) | Never Node, never npm/yarn/pnpm. Always pin `latest` tag in Dockerfiles — no outdated minor pins like `1.1`. |
| Containerization | **Docker only** | All deps inside containers. Never install on host. |
| Frontend | **Nuxt 4** + **Nuxt UI** | SSR app. |
| Styling | **Tailwind CSS** | Never hand-written CSS except config files. |
| Backend | **Supabase (self-hosted, OSS)** | NOT Supabase cloud/SaaS. |
| ORM / Migrations | **Prisma** (in frontend app) | Manages Supabase schema. Migrations only — never `db push` on deploy. |
| Deploy | **Portainer** + **Traefik** | Never suggest other clouds (AWS/Vercel/Fly/etc). Traefik is **deploy-only**; not present on dev host. |

### 1.0 Local dev vs production — two different worlds

- **Local (`docker compose up`):** dev only. Runs `bun dev` with HMR + Nuxt devtools. Source bind-mounted. **No production build, no `nuxt build`, no Dockerfile.** Hot reload is sacred.
- **Production:** separate concern. Builds via `Dockerfile`, deploys via Portainer + Traefik. We discuss this **much later** — not when scaffolding, not when developing features.
- ❌ Never put `build:` directive on `app` service in local `docker-compose.yml`.
- ❌ Never run `nuxt build` / `bun run build` as part of local dev workflow.
- ✅ Local `app` service = `oven/bun:latest` image + bind-mount + `bun dev`.

### 1.1 Host has NOTHING installed

Dev host runs **only Docker**. No Bun, no Node, no npm, no Prisma CLI, no Nuxt CLI on host.

- ❌ Never tell user to run `bun create`, `bun install`, `bun add`, `bunx ...`, `npx ...`, `prisma ...`, `nuxt ...` on host.
- ✅ Every command runs **inside a container**. Examples:
  - Scaffold: `docker compose run --rm app bun create nuxt@latest .`
  - Add dep: `docker compose run --rm app bun add <pkg>`
  - Prisma migrate (dev): `docker compose run --rm app bunx prisma migrate dev --name <x>`
  - One-off shell: `docker compose run --rm app sh`
- Use a dev-mode compose override (`docker-compose.override.yml` or `compose.dev.yml`) that mounts source as a volume so file changes reflect in the container.
- Traefik labels live in compose for deploy, but Traefik daemon **does not run locally**. Local access = `expose` + manual port publish in dev override only.

---

## 2. Architecture

- **Per-tenant isolation:** each client (shop) gets own full stack — own Supabase + own Nuxt frontend.
- **Zero cross-tenant access:** shops never see each other's DB. Hard isolation, not row-level.
- **Auto-bootstrap:** on new instance start, app runs Prisma migrations + seeds default schema/config automatically. No manual setup step.

---

## 3. Product Scope

### Public site (auto-generated per instance)
- Root = customer-facing storefront.
- Browse listings, search, filter, view car detail.
- Detail page → WhatsApp CTA (gated by lead-capture form, see §4).

### Admin interface (shop owner)
- CRUD vehicles: create, edit, activate/deactivate listings.
- Vehicle attributes: A/C, transmission (manual/automatic), etc. — needs full attribute mgmt UI.
- Customer/lead management (CRM-style).

### Lead capture
- Customer info captured two ways:
  1. Admin enters manually.
  2. Prospect fills quick form before WhatsApp button reveals.

---

## 4. Design System

- **Colors:**
  - Primary (Dark Red / Maroon): `#8B1A1A`
  - Background / Neutral: `#FFFFFF`
- **Components:** prefer Nuxt UI components. Build custom only when Nuxt UI lacks it.
- **Tailwind only** for styling. Config files are the only place raw CSS allowed.

---

## 5. Locale

- Code, comments, identifiers, this file: English.
- **Every user-visible string: pt-BR.** Labels, buttons, errors, emails, validation messages, meta tags — all pt-BR.

---

## 6. Hard Rules (don't violate)

- ❌ No Node runtime. Only Bun.
- ❌ No raw CSS outside config.
- ❌ No Supabase cloud — self-hosted only.
- ❌ No alternate hosting suggestions — Portainer + Traefik only.
- ❌ No shared DB across tenants.
- ❌ No host-installed dependencies — Docker only. Never instruct user to run anything on host except `docker` / `docker compose`.
- ❌ Never `prisma db push` on deploy/boot — data-loss risk. Migrations only.
- ❌ Never pin outdated Bun minor (e.g. `oven/bun:1.1`). Use `oven/bun:latest`.
- ❌ No Traefik on dev host — deploy-only concern.
- ✅ Auto-migrate on instance boot (`prisma migrate deploy` only, fail loud if no migrations).
- ✅ pt-BR for all UI.

---

## 7. Production DB Bootstrap (not yet implemented)

**Problem:** `supabase/db/` init SQL files are bind-mounted in local dev but unavailable on the Portainer host (no git clone, no bind mounts — app is a pulled image).

**Planned approach: init container pattern**

1. Dockerfile `COPY`s `supabase/db/` into the app image (e.g. `/app/supabase/db/`).
2. `portainer-docker-compose.yml` defines a `db-init` service:
   - `image: ghcr.io/org/pherro-app:latest` (same app image)
   - `restart: "no"`
   - `depends_on: db: { condition: service_healthy }`
   - Runs a shell script with multiple `psql` invocations (different connection strings for `postgres` db and `_supabase` db)
   - Exits 0 on success, never restarts
3. All other Supabase services (`auth`, `rest`, `realtime`, etc.) set `depends_on: db-init: { condition: service_completed_successfully }`.

**Known rewrite needed:** `roles.sql` uses `\set pguser` psql meta-variables — must be rewritten as a shell script substituting env vars before passing to psql.

**Cross-database files** (`_supabase.sql`, `logs.sql`, `pooler.sql`) require separate psql invocations connecting to the `_supabase` database — handle in the same shell script with a second `DATABASE_URL`.

---

## 8. Pinned Dependency Versions

| Package | Pinned version | Notes |
|---|---|---|
| `nuxt` | `^4.4.5` | Nuxt UI v4 requires Nuxt 4 |
| `@nuxt/ui` | `^4.7.1` | v4 = Nuxt UI + Nuxt UI Pro unified, fully open-source |
| `tailwindcss` | `^4.3.0` | Tailwind v4 — no `tailwind.config.js`; config via CSS |

### Tailwind v4 setup (no config file)

Tailwind v4 is configured entirely via CSS, not `tailwind.config.js`. The entry point is `app/assets/css/main.css`:

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

And registered in `nuxt.config.ts`:

```ts
css: ['~/assets/css/main.css']
```

- ❌ No `tailwind.config.js` or `tailwind.config.ts` — Tailwind v4 does not use one.
- ✅ Custom theme tokens go in `@theme {}` blocks inside the CSS file.
- ✅ `@nuxt/ui` module auto-registers `@nuxt/icon`, `@nuxt/fonts`, `@nuxtjs/color-mode`.
- ✅ `UApp` wrapper in `app.vue` is required for Toast, Tooltip, and programmatic overlays.

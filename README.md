# Pherro

![Bun](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

> **⚠️ Trabalho em andamento.** Este projeto está em desenvolvimento ativo. Funcionalidades, estrutura e documentação podem mudar a qualquer momento.

**SaaS multi-tenant de gestão para revendas de veículos usados.** Uma única stack compartilhada (um Nuxt + um NestJS + um Postgres) atende **todas** as revendas. Cada loja é uma **linha** na tabela `Tenant`, com isolamento de dados em nível de linha (`tenantId` + auto-escopo do Prisma + Row-Level Security do Postgres). Criar uma nova loja é um `INSERT` — **sem deploy**.

---

## Visão Geral

O Pherro tem quatro superfícies, todas servidas pela mesma stack e roteadas pelo **hostname** da requisição (o domínio **é** o tenant):

| Superfície | Host (produção) | Host (dev) | O que é |
|---|---|---|---|
| **Site do produto** | `pherro.app` / `www.pherro.app` | `localhost:3000` | Landing page de marketing + cadastro público (`/cadastro`). |
| **Painel da plataforma** | `app.pherro.app` | `app.localhost:3000` | Área do super-admin: gestão de tenants, planos e status. |
| **Vitrine do lojista** | `<slug>.pherro.app` / domínio próprio | `<slug>.localhost:3000` | Site público da revenda + painel administrativo (`/admin`). |
| **Demonstração ao vivo** | `demo.pherro.app` | `demo.localhost:3000` | Sandbox descartável — cada visitante ganha um tenant novo e efêmero. |

### Site público da revenda (por tenant)
- Vitrine de veículos com busca, filtros e página de detalhe.
- Detalhe do veículo → CTA para WhatsApp, liberado após formulário de captação de lead.
- Cada loja é isolada por host e tem sua própria configuração (nome, logo, WhatsApp).

### Painel administrativo (lojista)
- CRUD de veículos: criar, editar, ativar/desativar anúncios (com fotos e atributos).
- Gestão de atributos (ar-condicionado, câmbio manual/automático, etc.).
- Gestão de leads (CRM simples), captados manualmente ou pelo formulário da vitrine.

### Painel da plataforma (super-admin)
- Login isolado em `/platform/login` (rejeita logins de lojista).
- Lista de tenants com badges de plano/status, link para o host de cada loja.
- Criar tenant (insert + seed atômico: `ShopConfig`, usuário ADMIN, 6 atributos padrão em pt-BR), editar nome/plano, suspender/reativar.
- Suspensão vale **na hora** — o cache do resolver de tenant é invalidado a cada alteração.

### Demonstração ao vivo
- Cada visitante recebe um tenant novo, semeado em pt-BR (veículos, fotos, atributos, leads), com auto-login como ADMIN daquela loja de teste.
- Sandbox atrelado a um cookie de sessão do navegador — fechou a janela, perde o sandbox. Tenants expirados são coletados por um sweep de TTL (padrão 6h).
- Banner permanente avisa que as alterações são descartadas, com CTA de cadastro sempre visível. Páginas `noindex`.

---

## Arquitetura

- **Stack única compartilhada.** Um Nuxt (SSR/BFF) + um NestJS + um Postgres para todos os tenants. Nova loja = `INSERT` + seed, sem deploy.
- **Isolamento em três camadas (defesa em profundidade):**
  1. **Extensão do Prisma Client** — injeta `tenantId` automaticamente em toda query, lendo o contexto de `AsyncLocalStorage`.
  2. **Postgres Row-Level Security** (`FORCE`, fail-closed) — via a GUC `app.current_tenant`. Sem tenant no contexto ⇒ **0 linhas**.
  3. **Filtros `tenantId` explícitos** onde necessário (cinto e suspensório).
- **Resolução de tenant por host** — subdomínio (`<slug>.pherro.app`) ou `Tenant.customDomain`; JWT carrega o claim `tenantId` para chamadas autenticadas; header `x-tenant-id` validado para S2S/dev.
- **O navegador nunca fala com o NestJS.** Só com o BFF do Nuxt (`/api/**`); o SSR do Nuxt faz proxy para o NestJS (`BACKEND_URL`), repassando o host original (`x-forwarded-host`) para o backend resolver o tenant.
- **Papéis de banco:** o runtime conecta como `app_runtime` (não-superusuário, `NOBYPASSRLS`). Superusuários burlam RLS mesmo com `FORCE` — o `DATABASE_URL` do runtime **nunca** aponta para `postgres`. Migrações usam `MIGRATE_DATABASE_URL` (postgres).
- **Boot:** o backend roda `prisma migrate deploy` ao subir. Provisionamento é em runtime (`POST /platform/tenants`), não no boot.

```
Navegador ──Host──▶ Traefik ──▶ Nuxt SSR (BFF) ──x-forwarded-host──▶ NestJS
                                                        │
                                    TenantMiddleware ──▶ AsyncLocalStorage
                                                        │
                        Extensão Prisma (tenantId) + RLS por transação (GUC)
                                                        ▼
                                                  Postgres (compartilhado)
```

### Repositório
- `/` — frontend Nuxt 4 (`package.json`, `nuxt.config.ts`, `app/`).
- `/backend` — backend NestJS (`package.json`, `src/`, `prisma/`).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | [Bun](https://bun.sh) (`oven/bun:latest`) — nunca Node/npm/yarn/pnpm |
| Frontend | [Nuxt 4](https://nuxt.com) + [Nuxt UI v4](https://ui.nuxt.com) (SSR) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com) (configurado via CSS, sem `tailwind.config.js`) |
| Backend | [NestJS](https://nestjs.com) sobre Fastify (Bun runtime) |
| Banco | [PostgreSQL](https://www.postgresql.org) (plain `postgres:16-alpine`, sem Supabase) |
| ORM / Migrações | [Prisma](https://www.prisma.io) (no backend, migrations-only) |
| Deploy | [Portainer](https://www.portainer.io) + [Traefik](https://traefik.io) (wildcard + domínio próprio, TLS sob demanda) |

---

## APIs integradas

### ASAAS — cobrança (integração principal)

[ASAAS](https://docs.asaas.com/reference/comece-por-aqui) gerencia planos, assinaturas e pagamentos. Um **customer** ASAAS por tenant; planos pagos = **subscriptions**.

- **Auth:** chave de API no header **`access_token`** (não `Authorization: Bearer`) + `User-Agent` obrigatório. Sandbox (`$aact_hmlg_`) e produção (`$aact_prod_`) têm URLs base distintas.
- **Fluxo de cadastro:** `POST /platform/signup` provisiona o tenant (plano `free`), depois, best-effort, cria o customer ASAAS (`externalReference` = id do tenant). **Falha do ASAAS nunca derruba o cadastro.**
- **Webhooks:** ASAAS → `POST /billing/webhooks/asaas`. Valida o header `asaas-access-token`, responde 2xx rápido, deduplica por id de evento (entrega at-least-once).
- **Degradação graciosa:** sem `ASAAS_API_KEY`, as chamadas ASAAS são puladas e logadas — o produto (cadastro incluso) segue funcionando.
- **Backend-only.** A chave nunca vai para o frontend/BFF.

### WhatsApp — captação de lead

CTA de contato na vitrine, liberado após o formulário de captação de lead. Cada tenant gerencia seus próprios números de WhatsApp no painel administrativo.

---

## Design System

Dois temas, um por superfície, diferenciados pela cor primária:

| Superfície | Cor primária | Fundo | Como |
|---|---|---|---|
| **Vitrine + admin do lojista** | Vermelho Escuro / Maroon `#8B1A1A` | Branco `#FFFFFF` | Rampa `--color-primary-*` padrão (não escopada). |
| **Painel da plataforma** | Âmbar / Dourado `#f59e0b` | Quase-preto | Classe `.theme-platform` remapeia a rampa `--color-primary-*` para âmbar. |

A rampa completa (`50`–`950`) de cada cor vive em [`app/assets/css/main.css`](app/assets/css/main.css) em blocos `@theme {}`. A classe `.theme-platform` (aplicada nos layouts `platform.vue` / `platform-auth.vue`) reescreve os tokens `primary`, então todo utilitário `primary`/`text-primary-*` sob ela vira âmbar automaticamente — sem edições por elemento. Assim o operador da plataforma nunca confunde visualmente o painel do super-admin com o painel de uma loja.

Componentes preferem [Nuxt UI v4](https://ui.nuxt.com); ajustes de tema em nível de projeto vão em [`app/app.config.ts`](app/app.config.ts) (via `compoundVariants`), não em props `:ui`.

---

## Pré-requisitos

**O host precisa ter apenas Docker instalado.** Bun, Node, npm, Prisma CLI — nada disso vai no host. Tudo roda dentro de containers.

### Desenvolvimento local

```sh
docker compose up
```

Sobe `app` (`bun dev`, HMR) + `backend` (`bun --watch`) + `db`, com o código bind-mounted. Sem build de produção no dev — hot reload é sagrado.

Hosts de dev (com `APP_BASE_DOMAIN=localhost` no `.env`):

| URL | Superfície |
|---|---|
| `http://localhost:3000` | Landing page + cadastro |
| `http://app.localhost:3000` | Painel da plataforma |
| `http://dev.localhost:3000` | Vitrine + admin do tenant semeado |
| `http://demo.localhost:3000` | Demonstração ao vivo |

Logins semeados (do `.env`):
- Admin do lojista: `TENANT_ADMIN_EMAIL/PASSWORD` em `dev.localhost:3000/admin/login`.
- Admin da plataforma: `PLATFORM_ADMIN_EMAIL/PASSWORD` em `app.localhost:3000/platform/login`.

Comandos rodam **dentro de containers**, nunca no host:
- Dep do frontend: edite `package.json`, depois `docker compose restart app`.
- Dep do backend: edite `backend/package.json`, depois `docker compose restart backend`.
- Migração (dev): `docker compose run --rm backend bunx prisma migrate dev --name <x>`.

---

## Migrações de Banco

- Migrações via `prisma migrate deploy` — **nunca** `prisma db push` em produção (risco de perda de dados).
- O boot do backend executa as migrações automaticamente (como `postgres`, via `MIGRATE_DATABASE_URL`).
- RLS é habilitado nas migrações (`FORCE ROW LEVEL SECURITY` + política `tenant_isolation` por tabela). A tabela `Tenant` (e `PlatformAdmin`) ficam **sem** RLS — são nível de plataforma.

---

## Produção

Deploy via Portainer + Traefik (`docker-compose.prod.yml`). Apenas o Traefik publica portas; `backend` e `db` ficam numa rede `internal: true` — sem exposição no host e sem saída para a internet.

- **TLS wildcard** (`*.pherro.app`, DNS-01) cobre apex + todos os subdomínios de tenant.
- **Domínios próprios** de tenant: certificado emitido **sob demanda** (HTTP-01) — apontar o DNS para o servidor já é a prova de propriedade; funciona sem redeploy.
- **Sem seed em produção.** O primeiro admin da plataforma é criado uma vez via `scripts/create-platform-admin.ts`; os demais tenants são provisionados pelo painel da plataforma.

---

## Locale

Todo texto visível ao usuário está em **pt-BR** (labels, botões, erros, e-mails, validações, meta tags). Código, comentários e identificadores estão em inglês.

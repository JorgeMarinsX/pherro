# Pherro

![Bun](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

> **⚠️ Trabalho em andamento.** Este projeto está em desenvolvimento ativo. Funcionalidades, estrutura e documentação podem mudar a qualquer momento.

Sistema de gestão para revendas de veículos usados. Multi-tenant: cada loja roda em uma stack isolada, com banco de dados próprio e sem acesso cruzado entre tenants.

---

## Visão Geral

Cada instância do Pherro inclui:

- **Site público** — vitrine de veículos para clientes, com busca, filtros e página de detalhe com CTA para WhatsApp (via formulário de captação de lead).
- **Painel administrativo** — gestão de veículos, atributos e leads (CRM simples).
- **Bootstrap automático** — ao subir, a instância executa migrações e configurações padrão sem intervenção manual.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | [Bun](https://bun.sh) (`oven/bun:latest`) |
| Frontend | [Nuxt 4](https://nuxt.com) + [Nuxt UI v4](https://ui.nuxt.com) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com) (configurado via CSS, sem `tailwind.config.js`) |
| Backend | [Supabase](https://supabase.com) **self-hosted** (OSS) |
| ORM / Migrações | [Prisma](https://www.prisma.io) |


---

## Pré-requisitos

**O host precisa ter apenas Docker instalado.** Bun, Node, npm, Prisma CLI — nada disso vai no host. Tudo roda dentro de containers.

---


## Migrações de Banco

- Migrações via `prisma migrate deploy` — **nunca** `prisma db push` em produção.
- O boot da instância executa as migrações automaticamente.

---

## Design System

| Token | Valor |
|---|---|
| Cor primária (Vermelho Escuro / Maroon) | `#8B1A1A` |
| Background / Neutro | `#FFFFFF` |

Componentes preferem [Nuxt UI](https://ui.nuxt.com). Customizações de tema ficam em `app/assets/css/main.css` via blocos `@theme {}`.

---

## Locale

Todo texto visível ao usuário está em **pt-BR**. Código, comentários e identificadores estão em inglês.

# ZenFlowAI

Local service-desk demo: Next.js 15 · Express · GraphQL · MySQL · Prisma.

Customers file tickets (`#ZEN-XXXX`). Nova answers first from the owned Help Center (optional local Ollama). Humans take over when confidence is low. Phases 1–8 are **this repo on your machine** — no cloud host, no email SaaS, no paid LLM.

[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%2B%20GraphQL%20%2B%20MySQL-6366f1)](#stack)
[![App](https://img.shields.io/badge/UI-localhost%3A3000-0ea5e9)](#run-in-cursor)
[![API](https://img.shields.io/badge/GraphQL-localhost%3A4000-8b5cf6)](#run-in-cursor)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Run in Cursor (Agent)

Open this repo in **Cursor**. Need **Node 20+**, **pnpm**, and **MySQL** on this machine (demo often port **3307**).

Paste this into Agent chat:

```text
Run ZenFlowAI for local testing.

1. Copy env files if missing:
   apps/backend/.env.example → apps/backend/.env
   apps/frontend/.env.local.example → apps/frontend/.env.local
2. In apps/backend/.env set DATABASE_URL to my local MySQL (often mysql://root@localhost:3307/zenflowai).
3. pnpm install
4. pnpm db:generate && pnpm db:migrate && pnpm db:seed
   If migrate fails on an old demo DB: prisma migrate resolve --applied 20260922150000_init then migrate again.
5. pnpm test
6. pnpm dev
7. Tell me when the UI is up at http://localhost:3000 and GraphQL at http://localhost:4000/graphql.
```

| After it runs | Open |
|---------------|------|
| **App UI** | [http://localhost:3000](http://localhost:3000) |
| **GraphQL** | [http://localhost:4000/graphql](http://localhost:4000/graphql) |
| **Login** | `customer@zenflowai.com` / `password123` (all demo users use `password123`) |

Agent can start the servers, run tests, and click through the UI. If MySQL is not running, start it first, then send the same prompt again.

Manual steps are in [Quick start](#quick-start).

## Stack

| Layer | What we use |
|-------|-------------|
| Frontend | Next.js 15, Tailwind, Apollo (`credentials: include`) |
| Backend | Express, Apollo Server 4, graphql-ws |
| DB | MySQL + Prisma (`pnpm db:migrate`) |
| Auth | Access JWT 15m in `localStorage`; refresh cookie `zenflow_refresh` (HttpOnly, SameSite=Lax) |
| Jobs | node-cron SLA sweep |
| Files | Local `UPLOAD_DIR` (default `./uploads`, gitignored) |

Roles: `CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN`.

Request path: Helmet → rate limit → IP blocklist → bot detection → JWT → RBAC → data scope → Zod → spam → audit.

## Quick start

Need Node ≥ 20, pnpm ≥ 9, MySQL (demo often `localhost:3307`).

```bash
git clone https://github.com/iamfaizalmunna/zenflowai.git
cd zenflowai
pnpm install
cp apps/backend/.env.example apps/backend/.env          # set DATABASE_URL
cp apps/frontend/.env.local.example apps/frontend/.env.local
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev   # http://localhost:3000  ·  GraphQL http://localhost:4000/graphql
```

Already-pushed demo DBs (old `db push`): run once  
`pnpm --filter backend exec prisma migrate resolve --applied 20260922150000_init`

CI (`.github/workflows/test.yml`) only runs `pnpm db:generate` + unit tests. No hosted MySQL.

## Demo logins

Password for all: `password123`

| Role | Email |
|------|-------|
| Super Admin | superadmin@zenflowai.com |
| Admin | admin@zenflowai.com |
| Supervisor | supervisor@zenflowai.com |
| Agent | agent@zenflowai.com, jordan@…, priya@…, marcus@…, lina@… |
| AI (Nova) | nova@zenflowai.com |
| Customer | customer@zenflowai.com |

Appearance (`/settings`) is per signed-in user. Login/public pages stay the default light theme.

## What ships

| | |
|--|--|
| Tickets | Create, queue, 3-column workspace, live thread (graphql-ws) |
| Nova | First assignee; owned KB + optional Ollama; “Still need a person” |
| Ops | SLA cron, CSAT, admin users/teams/routing/SLA/KB drafts |
| UI | Per-user Appearance, ticket views, PWA chrome ≤1024px |
| Analytics | `/analytics` (SUPERVISOR+); consultants ADMIN+ |
| Phase 8 | Refresh cookie, committed Prisma migrations, local attachments, in-app bell |

Not in this demo: email, S3/R2, Firecrawl, paid OpenAI, webhooks, SSO, hosting.

KB markdown lives in `apps/backend/kb/` (seeded). Ollama is optional; retrieval still works without it. `pnpm --filter backend ai:doctor` prints the engine.

## Layout

```
apps/backend/   prisma/  kb/  src/{graphql,services,security,jobs,utils}
apps/frontend/  src/{app,modules,components,lib,store}
PLAN.md         architecture snapshot
```

Resolvers stay thin (auth + permission + service). Prisma stays in `services/`.

## GraphQL (common)

```graphql
mutation { login(email: "...", password: "...") { accessToken user { id role } } }
mutation { refreshToken { accessToken } }          # cookie, not JSON refresh token
query { me { id role } myNotifications { id title ticketId isRead } }
mutation { createTicket(input: { title, description, type: QUESTION }) { ticketNumber } }
mutation { uploadTicketAttachment(ticketId: 1, filename: "a.png", mimeType: "image/png", contentBase64: "...") { id } }
subscription { messageAdded(ticketId: 1) { id body } }
```

See [`PLAN.md`](./PLAN.md) for roles, env names, and file conventions.

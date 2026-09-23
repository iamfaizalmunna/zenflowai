<p align="center">
  <img src="apps/frontend/public/icons/icon.svg" width="72" height="72" alt="ZenFlowAI">
</p>

<h1 align="center">ZenFlowAI</h1>

<p align="center">
  Local service-desk demo — tickets <code>#ZEN-XXXX</code>, Nova first reply, live agent workspace.<br>
  Phases 1–9 are complete. No cloud host. No email SaaS. No paid LLM.
</p>

<p align="center">
  <a href="#run-in-cursor-agent"><img src="https://img.shields.io/badge/UI-localhost%3A3000-0ea5e9?style=flat-square" alt="UI"></a>
  <a href="#run-in-cursor-agent"><img src="https://img.shields.io/badge/GraphQL-localhost%3A4000-8b5cf6?style=flat-square" alt="GraphQL"></a>
  <a href="docs/phases/README.md"><img src="https://img.shields.io/badge/Phases-1--9-6366f1?style=flat-square" alt="Phases"></a>
  <a href="http://localhost:3000/qa/v1/"><img src="https://img.shields.io/badge/QA-%2Fqa%2Fv1-22c55e?style=flat-square" alt="QA"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=flat-square&logo=graphql&logoColor=white" alt="GraphQL">
  <img src="https://img.shields.io/badge/Apollo-311C87?style=flat-square&logo=apollographql&logoColor=white" alt="Apollo">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Ollama-000000?style=flat-square&logo=ollama&logoColor=white" alt="Ollama">
</p>

<p align="center">
  <a href="#completed-phases">Phases</a> ·
  <a href="#run-in-cursor-agent">Run in Cursor</a> ·
  <a href="#why-this-stack">Stack</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#demo-logins">Logins</a> ·
  <a href="PLAN.md">PLAN.md</a> ·
  <a href="docs/phases/README.md">Phase charts</a> ·
  <a href="docs/test-results/README.md">Test report</a>
</p>

---

## Completed phases

Nine slices, in order. Open a title for the full story (intro, who it is for, screens, steps, then the chart). Journey pictures in the browser gallery.

| | Phase | What shipped |
|:--:|:------|:-------------|
| [![01](https://img.shields.io/badge/01-6366f1?style=flat-square)](docs/phases/01-auth.md) | **[Auth and security](docs/phases/01-auth.md)** | JWT 15m, refresh cookie, RBAC ladder, ten request checks |
| [![02](https://img.shields.io/badge/02-0ea5e9?style=flat-square)](docs/phases/02-tickets.md) | **[Tickets and routing](docs/phases/02-tickets.md)** | `#ZEN-XXXX`, keyword → category → priority → fallback, owned Help Center |
| [![03](https://img.shields.io/badge/03-8b5cf6?style=flat-square)](docs/phases/03-workspace.md) | **[Live workspace](docs/phases/03-workspace.md)** | Three-column desk, `graphql-ws` thread, related articles, suggest reply |
| [![04](https://img.shields.io/badge/04-f59e0b?style=flat-square)](docs/phases/04-sla-csat.md) | **[SLA, CSAT, admin](docs/phases/04-sla-csat.md)** | 2-minute cron, warning / breach / auto-close, survey 1–5, admin screens |
| [![05](https://img.shields.io/badge/05-ec4899?style=flat-square)](docs/phases/05-appearance.md) | **[Appearance](docs/phases/05-appearance.md)** | Theme per signed-in user; login stays light |
| [![06](https://img.shields.io/badge/06-14b8a6?style=flat-square)](docs/phases/06-analytics.md) | **[Analytics](docs/phases/06-analytics.md)** | Supervisor charts, admin consultants, 90 / 112 day packs |
| [![07](https://img.shields.io/badge/07-a855f7?style=flat-square)](docs/phases/07-nova.md) | **[Nova](docs/phases/07-nova.md)** | Owned KB, optional Ollama, handoff below 0.45, drafts never auto-public |
| [![08](https://img.shields.io/badge/08-64748b?style=flat-square)](docs/phases/08-hardening.md) | **[Hardening](docs/phases/08-hardening.md)** | HttpOnly refresh cookie, Prisma migrations, local files, in-app bell |
| [![09](https://img.shields.io/badge/09-10b981?style=flat-square)](docs/phases/09-ui-qa.md) | **[UI, speed, QA](docs/phases/09-ui-qa.md)** | Turbopack, skeletons, 140 unit tests, report at `/qa/v1` |

**Charts (browser):** [http://localhost:3000/qa/phases](http://localhost:3000/qa/phases) · [docs/phases/index.html](docs/phases/index.html)  
**Stories (GitHub):** [docs/phases](docs/phases/README.md) · **Architecture:** [PLAN.md](PLAN.md) · **Test bars:** [http://localhost:3000/qa/v1](http://localhost:3000/qa/v1/)

Roles stay `CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN`.

---

## Run in Cursor (Agent)

Open this repository in **Cursor**. Required: **Node 20+**, **pnpm 9+**, **MySQL** (demo often port **3307**). The Agent copies env files, migrates, tests, and starts both servers.

**Paste into Agent chat**

```text
Run ZenFlowAI for local testing.

1. Copy env files if missing:
   apps/backend/.env.example → apps/backend/.env
   apps/frontend/.env.local.example → apps/frontend/.env.local
2. In apps/backend/.env set DATABASE_URL to my local MySQL (often mysql://root@localhost:3307/zenflowai).
3. pnpm install
4. pnpm db:generate && pnpm db:migrate && pnpm db:seed
   If migrate fails on an old demo DB: prisma migrate resolve --applied 20260922150000_init then migrate again.
5. pnpm test && pnpm test:e2e
   Open docs/test-results/v1/index.html for the versioned results sheet.
6. pnpm dev
7. Tell me when the UI is up at http://localhost:3000 and GraphQL at http://localhost:4000/graphql.
```

| After it runs | Open |
|---------------|------|
| App | [http://localhost:3000](http://localhost:3000) |
| Phase charts | [http://localhost:3000/qa/phases](http://localhost:3000/qa/phases) |
| Test report | [http://localhost:3000/qa/v1/](http://localhost:3000/qa/v1/) |
| GraphQL | [http://localhost:4000/graphql](http://localhost:4000/graphql) |
| Login | `customer@zenflowai.com` / `password123` (every demo user) |

If MySQL is down, start it, then send the same prompt again. Manual steps: [Quick start](#quick-start).

---

## Why this stack

Each item below is in the running product. Unused names are not listed.

| Layer | Choice | Why it is here |
|-------|--------|----------------|
| UI | Next.js 15, React 18, TypeScript, Tailwind, shadcn / Radix, Framer Motion, PWA | One app for desktop and a 1024px chrome. Turbopack is only `pnpm dev`. |
| Data to the UI | Apollo Client, GraphQL, graphql-ws | Same contract for screens and scripts. Live thread without Socket.io. |
| Auth state | Zustand (auth only) | Everything else stays in the Apollo cache. |
| API | Node 20, Express, Apollo Server 4 | Thin resolvers: auth + permission + service. |
| Database | Prisma, MySQL | Tickets and sessions on one machine. Migrations are committed. |
| Auth | JWT 15m + `zenflow_refresh` cookie | Refresh stays HttpOnly. Role is re-read from MySQL (8s cache). |
| Input | Zod, bcrypt | Validate before Prisma. Passwords hashed. |
| Jobs | node-cron | SLA warning, breach, auto-close. |
| AI | Owned markdown + optional Ollama | No paid LLM. Retrieval still works if Ollama is down. |
| Ship | pnpm, Turbo, GitHub Actions, ESLint, optional Sonar | CI has no MySQL. Unit pack is Prisma-free. |

Security order: Helmet → rate limit → IP blocklist → bot detection → JWT → RBAC → data scope → Zod → spam → audit.

---

## Quick start

Node ≥ 20, pnpm ≥ 9, MySQL (often `localhost:3307`).

```bash
git clone https://github.com/iamfaizalmunna/zenflowai.git
cd zenflowai
pnpm install
cp apps/backend/.env.example apps/backend/.env          # set DATABASE_URL
cp apps/frontend/.env.local.example apps/frontend/.env.local
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev   # http://localhost:3000  ·  GraphQL http://localhost:4000/graphql
```

Old `db push` databases: run once  
`pnpm --filter backend exec prisma migrate resolve --applied 20260922150000_init`

CI runs `pnpm db:generate` + unit tests only. No hosted MySQL.

---

## Demo logins

Password for every account: `password123`

| Role | Email |
|------|-------|
| Super Admin | superadmin@zenflowai.com |
| Admin | admin@zenflowai.com |
| Supervisor | supervisor@zenflowai.com |
| Agent | agent@zenflowai.com, jordan@…, priya@…, marcus@…, lina@… |
| AI (Nova) | nova@zenflowai.com |
| Customer | customer@zenflowai.com |

Appearance at `/settings` is per signed-in user. Login and register stay on the default light theme.

---

## What the demo includes

| Area | In the product |
|------|----------------|
| Tickets | Create, queue, three-column workspace, live thread |
| Nova | First assignee when on the team; owned KB; optional Ollama; handoff |
| Ops | SLA cron, CSAT, users / teams / routing / SLA / KB drafts |
| UI | Per-user Appearance, PWA chrome ≤1024px |
| Speed | Turbopack, skeletons, 90-day consultant packs, client list search |
| Analytics | `/analytics` (Supervisor+); consultants (Admin+) |

Not in this demo: email, S3/R2, Firecrawl, paid OpenAI, webhooks, SSO, hosting.

Help Center markdown: `apps/backend/kb/`. Engine check: `pnpm --filter backend ai:doctor`.

---

## Architecture

```
apps/backend/    prisma/  kb/  src/{graphql,services,security,jobs,utils}
apps/frontend/   src/{app,modules,components,lib,store}
PLAN.md          architecture snapshot
docs/phases/     one story per phase + HTML gallery
docs/test-results/   HTML test bars
```

Resolvers stay thin (auth + permission + service). Prisma stays in `services/`. One frontend module does not import another module’s internals.

---

## GraphQL

One API for the UI and scripts. Refresh uses the cookie, not a JSON refresh token.

```graphql
mutation { login(email: "...", password: "...") { accessToken user { id role } } }
mutation { refreshToken { accessToken } }
query { me { id role } myNotifications { id title ticketId isRead } }
mutation { createTicket(input: { title, description, type: QUESTION }) { ticketNumber } }
mutation { uploadTicketAttachment(ticketId: 1, filename: "a.png", mimeType: "image/png", contentBase64: "...") { id } }
subscription { messageAdded(ticketId: 1) { id body } }
```

---

## Speed and tests

Admin tab lag was on-demand compile of each `'use client'` page, then GraphQL auth hitting MySQL twice — not the SLA form.

| Layer | Change | Side effect |
|-------|--------|-------------|
| Dev compile | `next dev --turbopack` | Production `next build` unchanged |
| First paint | `loading.tsx` skeletons | Sidebar stays mounted |
| Tab change | CSS `animate-route-in` on the page slot | Reduced-motion still disables it |
| Auth | JWT verified every time; identity cached **8s** | Ban / role change can lag 8s |
| Consultants | Assigned tickets **90 days** (profile **112**) | KPIs are the pack, not lifetime |
| Lists | `filterByQuery` on the loaded pack | `admin` also matches `SUPER_ADMIN` |
| Help Center | Browser filter of the **40-article** pack | Create-ticket search still hits GraphQL after 4 characters |

Unchanged on purpose: role ladder, `#ZEN-XXXX`, resolver → service → Prisma, cookies, SLA math, queue subscriptions, Nova handoff.

```bash
pnpm test          # 140 Prisma-free units + journeys (100% c8 lines on that pack)
pnpm test:e2e      # live GraphQL when the API is up
pnpm test:report   # docs/test-results/v1/index.html
```

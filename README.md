<p align="center">
  <img src="apps/frontend/public/icons/icon.svg" width="88" height="88" alt="ZenFlowAI">
</p>

<h1 align="center">ZenFlowAI</h1>

<p align="center">
  <strong>Local service-desk demo</strong> — tickets, Nova, and a live agent workspace.<br>
  Customers file <code>#ZEN-XXXX</code>. Nova answers first from the owned Help Center
  (optional local Ollama). Humans take over when confidence is low.
</p>

<p align="center">
  Phases 1–9 are <strong>this repo on your machine</strong> — no cloud host, no email SaaS, no paid LLM.
</p>

<p align="center">
  <a href="#run-in-cursor-agent"><img src="https://img.shields.io/badge/UI-localhost%3A3000-0ea5e9?style=flat-square" alt="UI localhost:3000"></a>
  <a href="#run-in-cursor-agent"><img src="https://img.shields.io/badge/GraphQL-localhost%3A4000-8b5cf6?style=flat-square" alt="GraphQL localhost:4000"></a>
  <a href="http://localhost:3000/qa/v1/"><img src="https://img.shields.io/badge/QA%20report-%2Fqa%2Fv1-22c55e?style=flat-square" alt="QA report"></a>
  <img src="https://img.shields.io/badge/Phases-1--9-6366f1?style=flat-square" alt="Phases 1 to 9">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Apollo-311C87?style=flat-square&logo=apollographql&logoColor=white" alt="Apollo">
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=flat-square&logo=graphql&logoColor=white" alt="GraphQL">
  <img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion">
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/Radix%20UI-161618?style=flat-square&logo=radixui&logoColor=white" alt="Radix UI">
  <img src="https://img.shields.io/badge/Lucide-F56565?style=flat-square&logo=lucide&logoColor=white" alt="Lucide">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA">
  <br>
  <img src="https://img.shields.io/badge/Node.js%2020-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 20">
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Ollama-000000?style=flat-square&logo=ollama&logoColor=white" alt="Ollama">
  <br>
  <img src="https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://img.shields.io/badge/Turbo-EF4444?style=flat-square&logo=turbo&logoColor=white" alt="Turbo">
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="GitHub Actions">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white" alt="ESLint">
  <img src="https://img.shields.io/badge/SonarQube-CB2431?style=flat-square&logo=sonarqube&logoColor=white" alt="SonarQube">
</p>

## Run in Cursor (Agent)

Open this repo in **Cursor**. Need **Node 20+**, **pnpm 9+**, and **MySQL** (demo often port **3307**). The Agent can copy env files, migrate, run tests, and start both servers.

**Paste this into Agent chat**

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

**When it’s up**

| | Open |
|---|---|
| App UI | [http://localhost:3000](http://localhost:3000) |
| Test report v1 | [http://localhost:3000/qa/v1/](http://localhost:3000/qa/v1/) · [docs/test-results](docs/test-results/README.md) |
| GraphQL | [http://localhost:4000/graphql](http://localhost:4000/graphql) |
| Login | `customer@zenflowai.com` / `password123` — every demo user uses that password |

If MySQL is not running, start it first, then send the same prompt again. Manual steps: [Quick start](#quick-start).

## Stack

| Layer | What we use |
|-------|-------------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind, Turbopack (`pnpm dev`), shadcn/ui + Radix, Framer Motion, Apollo Client (`credentials: include`), Zustand (auth only), Recharts, Lucide, next-themes, PWA |
| API | Express, Apollo Server 4, GraphQL, graphql-ws |
| Data | MySQL + Prisma (`pnpm db:migrate`) |
| Auth | Access JWT 15m in `localStorage`; refresh cookie `zenflow_refresh` (HttpOnly, SameSite=Lax, 7d) |
| Security | Helmet → rate limit → IP blocklist → bot detection → JWT → RBAC → data scope → Zod → spam → audit · bcrypt |
| Jobs | node-cron SLA sweep |
| AI | Owned Help Center markdown + optional local Ollama |
| Files | Local `UPLOAD_DIR` (default `./uploads`, gitignored) |
| Tooling | pnpm workspaces, Turbo, GitHub Actions, c8, ESLint, optional SonarQube |

Roles: `CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN`.

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
| Speed | Turbopack in `pnpm dev`, route skeletons, 90-day consultant packs, client list search |
| Analytics | `/analytics` (SUPERVISOR+); consultants ADMIN+ |
| Phase 8 | Refresh cookie, committed Prisma migrations, local attachments, in-app bell |
| Phase 9 | Lighter mobile, calmer desktop, Turbopack, skeletons, 140 unit tests, HTML report at `/qa/v1/` |

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

## UI speed (what changed, what did not)

Admin tab lag was **on-demand compile** of each `'use client'` page, then GraphQL auth hitting MySQL twice. The SLA form itself was not the bottleneck.

| Layer | Change | Side effect |
|-------|--------|-------------|
| Dev compile | `next dev --turbopack` | Production `next build` is unchanged |
| First paint | `loading.tsx` skeletons on admin, agent, customer, and settings | Sidebar/`AppShell` stay mounted |
| Tab change | CSS `animate-route-in` on the page slot only | Reduced-motion still disables animation |
| Auth | JWT still verified every request; user + permission rows cached **8s** | Ban / role change can lag up to 8s |
| Consultants / leaderboard | Assigned tickets limited to **90 days** (profile **112 days**) | Solved/CSAT KPIs are the pack, not lifetime |
| Lists | `filterByQuery` on the loaded pack | Substring match: `admin` hits `SUPER_ADMIN` |
| Help Center | Search filters the **40-article** pack in the browser | Create-ticket related articles still query GraphQL after 4 characters |
| Charts | `Infographic` / Recharts load lazily | First chart shows a pulse, then the plot |

Unchanged on purpose: role ladder, ticket `#ZEN-XXXX`, resolver → service → Prisma, login/refresh cookies, SLA policy math, queue subscriptions, Nova handoff.

```bash
pnpm test          # 140 Prisma-free units + journeys + regression (100% c8 lines on that pack)
pnpm test:e2e      # live GraphQL: customer pack + admin SLA/consultants
pnpm test:report   # docs/test-results/v1/index.html  (phase bars, not one table)
```

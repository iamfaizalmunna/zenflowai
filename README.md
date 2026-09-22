# ZenFlowAI

> Phase 7 AI consultant for a clean, fast, AI-ready ticketing system.
> Built with Next.js · Express · GraphQL · MySQL · Prisma.
> Local + GitHub only — no cloud host is wired.

[![Phase](https://img.shields.io/badge/Phase-7%20AI%20Consultant-blue)](#phases)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%2B%20GraphQL%20%2B%20MySQL-6366f1)](#stack)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What is ZenFlowAI?

ZenFlowAI is a **medium-scale service desk and ticketing platform** — think Zendesk × Linear, simplified for real teams.

- Customers submit tickets on the web, browse the Help Center, and rate CSAT after resolve
- Agents work tickets in a **3-column workspace** with graphql-ws live updates
- Supervisors watch SLA due times; admins edit users, teams, routing, SLA hours, and KB drafts
- Signed-in users personalize the UI at **Appearance** (`/settings`); prefs persist **per user** in MySQL. Login and public pages always stay the default light iris look.
- Mobile-first app chrome at ≤1024px, plus a PWA manifest
- Every sensitive write is audit-logged. Every role sees only what they should.

**AI consultant Nova is first responder.** Answers come from owned KB (optional local Ollama). Humans take over only if confidence is low. No API key required.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion | Micro-frontend structure — each role is an isolated module |
| **Backend** | Express.js, Apollo GraphQL (Apollo Server 4) | GraphQL Subscriptions = real-time built-in |
| **Database** | MySQL + Prisma ORM | Type-safe, schema-first, easy migrations |
| **Auth** | JWT access (15m) in `localStorage` + refresh token mutation (7d) | HTTP-only cookie transport is not wired yet |
| **Real-time** | GraphQL Subscriptions via graphql-ws | `messageAdded`, `ticketUpdated`, `ticketCreated` |
| **Background Jobs** | node-cron SLA sweep | Warnings, breaches, auto-close 48h after resolve |
| **PWA** | `manifest.webmanifest` + `sw.js` | Installable; app chrome at ≤1024px |
| **Monorepo** | pnpm workspaces + Turborepo | `apps/backend` + `apps/frontend` + `packages/shared` |
| **Token Saving** | Apollo APQ + Token Savior MCP | -60–80% tokens per AI session |

---

## Role Hierarchy

```
CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN
```

Each role sees a different layout, different data, different actions. Nothing leaks between roles.

---

## Security — layers in use

```
Request → [L1 Helmet] → [L2 Rate Limit] → [L3 IP Blocklist] → [L4 Bot Detection]
        → [L5 JWT Auth] → [L6 RBAC] → [L7 Data Scoping]
        → [L8 Input Validation] → [L9 Spam Detection] → [L10 Audit Log] → Response
```

HTTP middleware is on from Phase 1. Ticket create also runs spam scoring, role
quotas, and cooldowns before a `#ZEN-XXXX` ticket is saved.

---

## Project Structure — actual (through Phase 7)

```
ZenFlowAI/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Includes UiPreference (ui_preferences)
│   │   │   └── seed.ts              # Roles, 6 consultants, 144 tickets, CSAT, spam
│   │   └── src/
│   │       ├── graphql/schemas/     # auth, user, ticket, knowledge, admin, csat, appearance
│   │       ├── graphql/resolvers/
│   │       ├── services/            # tickets, routing, SLA, CSAT, Q&A, appearance, analytics, consultants, security, …
│   │       ├── jobs/slaCron.ts      # node-cron SLA sweep
│   │       ├── security/            # RBAC, audit, spam, fair usage, HTTP stack
│   │       ├── middleware/auth.ts
│   │       └── utils/               # prisma, pubsub, #ZEN-XXXX
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── (auth)/          # /login, /register, /forgot-password
│           │   ├── (customer)/      # /dashboard, /tickets, /tickets/new, /knowledge
│           │   ├── (agent)/         # /queue, /knowledge/internal, /supervisor
│           │   ├── (admin)/admin/   # users, teams, routing, sla, knowledge, consultants, security
│           │   ├── analytics/       # SUPERVISOR+ infographic dashboard
│           │   └── settings/        # Appearance studio
│           ├── modules/auth/
│           ├── modules/tickets/
│           ├── modules/admin/
│           ├── modules/appearance/  # myAppearance / saveAppearance GraphQL
│           ├── components/layout/   # AppShell, Sidebar, MobileChrome, PWA
│           ├── components/ui/       # Field, Select, shared control styles
│           ├── hooks/               # useAppearance, useUiSound
│           ├── lib/                 # Apollo, appearance tokens/session, sounds, nav, charts
│           └── store/               # Zustand auth only
│
├── packages/shared/                 # Placeholder types (app code does not rely on these)
├── PLAN.md
└── turbo.json
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 — `npm i -g pnpm`
- MySQL running locally

### 1. Clone & install

```bash
git clone https://github.com/iamfaizalmunna/zenflowai.git
cd zenflowai
pnpm install
```

### 2. Environment setup

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL with your MySQL connection

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 3. Database

```bash
pnpm db:generate   # generate Prisma client
pnpm db:seed       # seed demo data
pnpm test          # unit tests (tsx --test), including appearance session + analytics
# prisma/migrations is gitignored; apply schema locally with `pnpm --filter backend exec prisma db push`
```

### 4. Run

```bash
pnpm dev
# Frontend  → http://localhost:3000
# GraphQL   → http://localhost:4000/graphql
# DB Studio → pnpm db:studio → http://localhost:5555
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@zenflowai.com | password123 |
| Admin | admin@zenflowai.com | password123 |
| Supervisor | supervisor@zenflowai.com | password123 |
| Agent | agent@zenflowai.com | password123 |
| Agent | jordan@zenflowai.com | password123 |
| Agent | priya@zenflowai.com | password123 |
| Agent | marcus@zenflowai.com | password123 |
| Agent | lina@zenflowai.com | password123 |
| AI consultant | nova@zenflowai.com | password123 |
| Customer | customer@zenflowai.com | password123 |

After login, **Appearance** is `/settings`: sounds, system/light/dark, accent + shade, matte/glossy/glass, font family/size, density, logo, default ticket view. Saved in `ui_preferences` **for that user only** via `myAppearance` / `saveAppearance`. Ticket queues also sort, filter (status + priority), and switch list / compact / card / icon views. Sign-out returns the guest shell to the product default.

---

## Phases

This project is built in 6 phases. Each phase = a working push to GitHub.

| Phase | What's built | Status |
|-------|-------------|--------|
| **1 — Foundation & Auth** | Auth screens, JWT auth service, role-aware layout, RBAC and security modules | ✅ Merged to `main` (with Phase 2) |
| **2 — Ticket Engine + Help Center** | Tickets, routing, SLA dates, messages, owned KB, unit tests | ✅ Merged to `main` ([#1](https://github.com/iamfaizalmunna/zenflowai/pull/1)) |
| **3 — Workspace & Real-time** | 3-column workspace, graphql-ws, related articles, template replies | ✅ Merged to `main` |
| **4 — Automation & Admin** | SLA cron, CSAT, admin screens, rule-based Help Center Q&A | ✅ Merged to `main` |
| **5 — UI Customization** | Appearance studio, per-user DB prefs, ticket sort/filter/views, click-only sounds | ✅ Merged to `main` ([#3](https://github.com/iamfaizalmunna/zenflowai/pull/3) isolation) |
| **6 — Analytics & Polish** | Infographic analytics, consultant profiles, security review, demo seed | ✅ Merged to `main` ([#2](https://github.com/iamfaizalmunna/zenflowai/pull/2)) |
| **7 — AI Consultant** | Nova AI-first tickets, grounded KB, optional Ollama, human handoff | ✅ On `phase/7-ai-consultant` |

See [`PLAN.md`](./PLAN.md) for the full architecture blueprint.

---

## Phase 7 capabilities

```
Customer opens a ticket
      ↓
Assigned to Nova (AI consultant)
      ↓
Retrieve owned KB → optional tiny Ollama if healthy → else extractive answer
      ↓
Cited reply in the thread (ticket create does not wait)
      ↓
Low confidence or “Still need a person” → human consultant
```

`pnpm --filter backend ai:doctor` never fails install. `ai:setup` is opt-in (no signup). `AI_PROVIDER=auto`.

## Phase 6 capabilities

```
Supervisor/Admin opens Analytics
      ↓
Range 7/30/90 days + chart-type switcher (line/area/bar/pie/donut/radial/radar)
      ↓
Leaderboard + customer feedback on resolved work
      ↓
Admin opens Consultants (ADMIN+ only) — progress, CSAT, assessment, completed tickets
      ↓
Security: audit log, block IP, spam confirm/dismiss
      ↓
Seed: 144 tickets, CSAT comments, spam queue, 6 consultants
```

## Phase 5 capabilities

```
Signed-in user opens Appearance (/settings)
      ↓
Sounds, light/dark, accent, finish, type, density, logo
      ↓
Prefs saved in MySQL (ui_preferences, unique userId) and restored on that login
      ↓
Ticket lists: sort, status/priority filter, list/compact/card/icon views
      ↓
Guest/login always stay the default ZenFlow light iris look
```

## Phase 4 capabilities

```
Ticket hits SLA warning / breach
      ↓
Cron notifies staff and flags the ticket
      ↓
Resolved tickets auto-close after 48h
      ↓
Customer rates CSAT (7-day window)
      ↓
Admin edits users, teams, routing, SLA hours, KB drafts
      ↓
Help Center Q&A cites owned articles (no API key)
```

## Phase 3 capabilities

```
Agent opens a ticket
      ↓
3-column workspace (info | thread | actions + related KB)
      ↓
SLA countdown from stored due dates
      ↓
Suggest Reply (category templates, no API key)
      ↓
graphql-ws: messageAdded / ticketUpdated / ticketCreated
      ↓
Customer create-ticket shows related Help Center hits
```

## Phase 2 capabilities (still in place)

```
Login (Phase 1)
      ↓
Customer creates a ticket
      ↓
Spam + quota checks, then #ZEN-XXXX
      ↓
Routing rule picks a team (and least-busy agent when possible)
      ↓
SLA first-response and resolve due dates stored
      ↓
Customer sees own tickets; agent sees the team queue
      ↓
Thread messages (reply / internal note)
      ↓
Help Center: public articles for customers, internal guides for staff
```

This is the light MVP through Phase 7: live workspace, SLA cron, CSAT, admin screens, Nova AI consultant (KB + optional Ollama), per-user Appearance, analytics/consultants/security, PWA. No Firecrawl, no paid LLM, no cloud host.

### What is installed vs what runs in the background

| Piece | On `pnpm install` | On GitHub | Runs in background |
|-------|-------------------|-----------|--------------------|
| Nova + consult chain (TypeScript) | Yes | Yes | With the API process |
| Owned KB (`apps/backend/kb/` + `shards/pack-01.jsonl`) | Seeded into MySQL (how-tos + first 400 shard articles) | Yes — this **is** the demo KB (~88MB unique JSONL under the 100MB GitHub cap) | No extra process |
| `ollama` **npm client** | Yes (tiny JS library) | Yes | No |
| Ollama **app + model** (~0.4–2GB) | **No** | **No** | Only if you already installed Ollama |
| Scraper / raw scrape cache | No | **No** (`data/kb/` gitignored) | No |

Nova answers from the seeded KB even when Ollama is not installed. `pnpm --filter backend ai:doctor` prints `engine=retrieval` or `engine=ollama`. The demo knowledge base is `apps/backend/kb/` including `shards/pack-01.jsonl`. Do not commit Ollama models or scrape cache.

---

## GraphQL API — Key Operations

```graphql
# Auth
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user { id name role }
  }
}

query CurrentUser {
  me { id email name role }
}

# Admin and Super Admin only
query Users {
  users { id email name role isActive isBanned }
}

# Tickets
mutation CreateTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    ticketNumber title status priority slaResponseDueAt slaResolutionDueAt
  }
}

query Tickets($filter: TicketFilter) {
  tickets(filter: $filter) { tickets { ticketNumber title status } total }
}

mutation AddMessage($input: AddMessageInput!) {
  addMessage(input: $input) { id body type }
}

# Help Center
query Knowledge($search: String) {
  knowledgeArticles(search: $search) { id title visibility }
}

query Related($ticketId: Int!) {
  relatedArticles(ticketId: $ticketId) { id title }
}

subscription OnMessage($ticketId: Int!) {
  messageAdded(ticketId: $ticketId) { id body type }
}

# Appearance (signed-in)
query MyAppearance {
  myAppearance {
    colorMode accentHex shade finish fontFamily fontSize
    density ticketView ticketSort soundsMuted logoDataUrl
  }
}

mutation SaveAppearance($input: AppearanceInput!) {
  saveAppearance(input: $input) { accentHex finish ticketView }
}
```

---

## Token Saving

This project is set up to minimise AI token usage across every session.

| Method | Saving | Setup |
|--------|--------|-------|
| **Token Savior MCP** | ~80% active tokens | See `.cursor/mcp.json` — restart Cursor |
| **Apollo APQ** | Query bandwidth reduction | Client link exists; server-side persisted-query cache is planned |
| **Cursor Rules** | Prevents full-file reads | Auto — `.cursor/rules/` |

```bash
# Activate Token Savior Bash compaction
pip install "token-savior-recall[mcp]"
export TS_BASH_COMPACT=1 && export TS_BASH_REWRITE=1
ts init --agent cursor --yes
```

---

## Not implemented yet

- Crawler / Firecrawl ingest and optional paid OpenAI
- Webhooks + HMAC retry
- Production refresh-token HTTP-only cookie transport
- Cloud hosting (this repo is local + GitHub only)

These are reserved for later. The README is updated after each phase so it
describes the code that actually exists.

## Roadmap (post Phase 7)

- [ ] Email notifications (SendGrid / Resend)
- [ ] File attachments (Cloudflare R2)
- [ ] Apollo Federation (split into microservices)
- [ ] AI classification (OpenAI / Groq adapter — architecture already ready)
- [ ] Voice-to-text ticket creation (Browser Web Speech API)
- [ ] Mobile app (React Native)
- [ ] SSO / SAML (enterprise auth)

---

*README updates with every phase. Last updated: Phase 7 AI consultant (Nova, grounded KB, optional Ollama, human handoff).*

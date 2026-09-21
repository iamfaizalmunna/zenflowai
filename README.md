# ZenFlowAI

> Phase 5 UI customization for a clean, fast, AI-ready ticketing system.
> Built with Next.js · Express · GraphQL · MySQL · Prisma.
> Local + GitHub only — no cloud host is wired.

[![Phase](https://img.shields.io/badge/Phase-5%20UI%20Customization-blue)](#phases)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%2B%20GraphQL%20%2B%20MySQL-6366f1)](#stack)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What is ZenFlowAI?

ZenFlowAI is a **medium-scale service desk and ticketing platform** — think Zendesk × Linear, simplified for real teams.

- Customers submit tickets via web (or voice, coming Phase 3)
- Agents work tickets in a **3-column workspace** with live chat
- Supervisors monitor SLA timers and escalations in real time
- Admins configure routing rules, teams, and SLA policies from the UI
- Every action is audit-logged. Every role sees only what they should.

**AI is optional infrastructure, not the foundation.** The system works fully without any AI key. The AI adapter is plugged in when ready — the architecture doesn't change.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion | Micro-frontend structure — each role is an isolated module |
| **Backend** | Express.js, Apollo GraphQL (Apollo Server 4) | GraphQL Subscriptions = real-time built-in |
| **Database** | MySQL + Prisma ORM | Type-safe, schema-first, easy migrations |
| **Auth** | JWT (15min) + Refresh Token (7d, HTTP-only cookie) | Short-lived access tokens + secure refresh |
| **Real-time** | GraphQL Subscriptions via graphql-ws | `messageAdded`, `ticketUpdated`, `ticketCreated` |
| **Background Jobs** | node-cron (SLA sweep) | Phase 4 |
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

## Project Structure — actual Phase 2

```
ZenFlowAI/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # MySQL schema and security models
│   │   │   └── seed.ts              # Five roles, teams, categories, SLA, rules
│   │   └── src/
│   │       ├── graphql/
│   │       │   ├── schemas/         # TypeDefs split by domain
│   │       │   └── resolvers/       # One resolver file per domain
│   │       ├── services/
│   │       │   ├── auth.service.ts      # Login, register, refresh, logout
│   │       │   ├── ticket.service.ts    # Create, list, get, update, counts
│   │       │   ├── message.service.ts   # Thread replies and internal notes
│   │       │   ├── routing.service.ts   # Keyword / category / priority / fallback
│   │       │   ├── sla.service.ts       # First-response and resolve due dates
│   │       │   └── knowledge.service.ts # Owned Help Center articles
│   │       ├── security/
│   │       │   ├── rbac.ts          # Permission map + requirePermission()
│   │       │   ├── audit.ts         # Immutable audit logger
│   │       │   ├── spamDetector.ts  # Heuristic spam/bot scoring
│   │       │   ├── fairUsage.ts     # Quota + random cooldown
│   │       │   └── httpSecurity.ts  # Middleware stack (Helmet, rate-limit, etc.)
│   │       ├── middleware/
│   │       │   └── auth.ts          # JWT → DB session verify → buildContext()
│   │       ├── types/
│   │       │   └── context.ts       # GraphQL request context
│   │       └── utils/
│   │           ├── prisma.ts            # Singleton client
│   │           └── ticketNumber.ts      # #ZEN-XXXX generator
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── (auth)/          # Login, Register, Forgot Password
│           │   ├── (customer)/      # Dashboard, tickets, Help Center
│           │   ├── (agent)/         # Queue, internal guides
│           │   └── (admin)/         # Admin users placeholder
│           ├── modules/auth/        # Auth components, hooks, GraphQL queries
│           ├── modules/tickets/     # TicketCard + ticket GraphQL documents
│           ├── components/layout/  # AppShell and role-aware Sidebar
│           ├── lib/                 # Apollo client, utils, constants
│           └── store/               # Persisted Zustand auth state
│
├── packages/
│   └── shared/                      # Shared TypeScript types
│
├── .cursor/
│   ├── mcp.json                     # Token Savior MCP config
│   └── rules/                       # Architecture + token-saving rules
│
├── PLAN.md                          # Master build plan (read before coding)
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
pnpm db:migrate    # run migrations
pnpm db:seed       # seed demo data
pnpm test          # unit tests including Phase 5 appearance tokens
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
After login, Appearance is at `/settings` (theme, sounds, accent, type, ticket views). Prefs persist in MySQL.

---

## Phases

This project is built in 6 phases. Each phase = a working push to GitHub.

| Phase | What's built | Status |
|-------|-------------|--------|
| **1 — Foundation & Auth** | Auth screens, JWT auth service, role-aware layout, RBAC and security modules | ✅ Implemented on `phase/1-foundation` |
| **2 — Ticket Engine + Help Center** | Tickets, routing, SLA dates, messages, owned KB, unit tests | ✅ Merged to `main` |
| **3 — Workspace & Real-time** | 3-column workspace, graphql-ws, related articles, template replies | ✅ Merged to `main` |
| **4 — Automation & Admin** | SLA cron, CSAT, admin screens, rule-based Help Center Q&A | ✅ Merged to `main` |
| **5 — UI Customization** | Appearance (theme, color, type, sounds, logo), ticket views — prefs in DB | ✅ Merged to `main` |
| **6 — Analytics & Polish** | Analytics + security dashboards, demo data (moved from old Phase 5) | 🔲 Planned |

See [`PLAN.md`](./PLAN.md) for the full architecture blueprint.

---

## Phase 5 capabilities

```
Signed-in user opens Appearance (/settings)
      ↓
Sounds, light/dark, accent, finish, type, density, logo
      ↓
Prefs saved in MySQL (ui_preferences) and restored on login
      ↓
Ticket lists: sort, status/priority filter, list/compact/card/icon views
      ↓
Defaults stay the current ZenFlow iris look
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

This is the light MVP plus live workspace: graphql-ws, related articles, template Suggest Reply. No crawler, no LLM, no cloud host.

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

- Crawler / Firecrawl ingest and optional OpenAI/Ollama
- Webhooks + HMAC retry
- Analytics and security dashboards (Phase 6)
- Production refresh-token HTTP-only cookie transport
- Cloud hosting (this repo is local + GitHub only)

These are reserved for Phase 6 and later. The README is updated after each phase so it
describes the code that actually exists.

## Roadmap (post Phase 6)

- [ ] Email notifications (SendGrid / Resend)
- [ ] File attachments (Cloudflare R2)
- [ ] Apollo Federation (split into microservices)
- [ ] AI classification (OpenAI / Groq adapter — architecture already ready)
- [ ] Voice-to-text ticket creation (Browser Web Speech API)
- [ ] Mobile app (React Native)
- [ ] SSO / SAML (enterprise auth)

---

*README updates with every phase. Last updated: Phase 5 — UI customization merged to `main`; analytics is Phase 6.*

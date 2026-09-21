# ZenFlowAI

> Phase 2 ticket engine for a clean, fast, AI-ready ticketing system.
> Built with Next.js · Express · GraphQL · MySQL · Prisma.
> Local + GitHub only — no cloud host is wired.

[![Phase](https://img.shields.io/badge/Phase-2%20Ticket%20Engine-blue)](#phases)
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
| **Real-time** | Planned for Phase 3 | Not implemented |
| **Background Jobs** | Planned for Phase 4 | Not implemented |
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
pnpm test          # Phase 1 + Phase 2 unit tests
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
| Customer | customer@zenflowai.com | password123 |

---

## Phases

This project is built in 5 phases. Each phase = a working push to GitHub.

| Phase | What's built | Status |
|-------|-------------|--------|
| **1 — Foundation & Auth** | Auth screens, JWT auth service, role-aware layout, RBAC and security modules | ✅ Implemented on `phase/1-foundation` |
| **2 — Ticket Engine + Help Center** | Tickets, routing, SLA dates, messages, owned KB, unit tests | ✅ Implemented on `phase/2-ticket-engine` (local + GitHub) |
| **3 — Workspace & Real-time** | 3-column agent workspace, GraphQL Subscriptions, live SLA timer | 🔲 Planned |
| **4 — Automation & Admin** | SLA cron, CSAT, admin routing UI, Knowledge Base | 🔲 Planned |
| **5 — Analytics & Polish** | Analytics dashboard, security dashboard, mobile, demo data | 🔲 Planned |

See [`PLAN.md`](./PLAN.md) for the full architecture blueprint.

---

## Phase 2 capabilities

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

This is the light MVP: no crawler, no GraphQL subscriptions, no LLM, no cloud deploy.

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

query Tickets($status: TicketStatus) {
  tickets(status: $status) { items { ticketNumber title status } total }
}

mutation AddMessage($input: AddMessageInput!) {
  addMessage(input: $input) { id body type }
}

# Help Center
query Knowledge($search: String) {
  knowledgeArticles(search: $search) { id title visibility }
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

- GraphQL WebSocket subscriptions and live queue
- SLA cron (warnings, breach, auto-close)
- 3-column agent workspace, CSAT, analytics, webhooks
- KB crawler / ingest (Phase 4)
- LLM / `askKnowledgeBase`
- Production refresh-token HTTP-only cookie transport
- Cloud hosting (this repo is local + GitHub only)

These are reserved for Phases 3–5. The README is updated after each phase so it
describes the code that actually exists.

## Roadmap (post Phase 5)

- [ ] Email notifications (SendGrid / Resend)
- [ ] File attachments (Cloudflare R2)
- [ ] Apollo Federation (split into microservices)
- [ ] AI classification (OpenAI / Groq adapter — architecture already ready)
- [ ] Voice-to-text ticket creation (Browser Web Speech API)
- [ ] Mobile app (React Native)
- [ ] SSO / SAML (enterprise auth)

---

*README updates with every phase. Last updated: Phase 2 — Ticket Engine + Help Center.*

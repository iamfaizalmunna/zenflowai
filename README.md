# ZenFlowAI

> Enterprise-grade ticketing system — clean, fast, AI-ready.
> Built with Next.js · Express · GraphQL · MySQL · Prisma · Real-time Subscriptions.

[![Phase](https://img.shields.io/badge/Phase-1%20In%20Progress-blue)](#phases)
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
| **Real-time** | GraphQL Subscriptions via `graphql-ws` | No Socket.io — pure GraphQL |
| **Background Jobs** | `node-cron` | SLA breach detection, auto-close, CSAT expiry |
| **Monorepo** | pnpm workspaces + Turborepo | `apps/backend` + `apps/frontend` + `packages/shared` |
| **Token Saving** | Apollo APQ + Token Savior MCP | -60–80% tokens per AI session |

---

## Role Hierarchy

```
CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN
```

Each role sees a different layout, different data, different actions. Nothing leaks between roles.

---

## Security — 10 Layers

```
Request → [L1 Helmet] → [L2 Rate Limit] → [L3 IP Blocklist] → [L4 Bot Detection]
        → [L5 JWT Auth] → [L6 RBAC] → [L7 Data Scoping]
        → [L8 Input Validation] → [L9 Spam Detection] → [L10 Audit Log] → Response
```

Each layer has one job. Simple. Clear-cut.

---

## Project Structure

```
ZenFlowAI/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Single source of truth — all 30+ models
│   │   │   └── seed.ts              # Demo data (5 roles, routing rules, tickets)
│   │   └── src/
│   │       ├── graphql/
│   │       │   ├── schemas/         # TypeDefs split by domain
│   │       │   └── resolvers/       # One resolver file per domain
│   │       ├── services/            # Business logic (pure, testable)
│   │       │   ├── auth.service.ts
│   │       │   ├── ticket.service.ts
│   │       │   ├── routing.service.ts
│   │       │   ├── sla.service.ts
│   │       │   └── ai/              # AI adapter (rule-based → swap for OpenAI/Groq)
│   │       ├── security/
│   │       │   ├── rbac.ts          # Permission map + requirePermission()
│   │       │   ├── audit.ts         # Immutable audit logger
│   │       │   ├── spamDetector.ts  # Heuristic spam/bot scoring
│   │       │   ├── fairUsage.ts     # Quota + random cooldown
│   │       │   └── httpSecurity.ts  # Middleware stack (Helmet, rate-limit, etc.)
│   │       ├── jobs/
│   │       │   └── slaChecker.ts    # node-cron: SLA breach + auto-close
│   │       ├── middleware/
│   │       │   └── auth.ts          # JWT → DB session verify → buildContext()
│   │       └── utils/
│   │           ├── prisma.ts        # Singleton client
│   │           └── pubsub.ts        # GraphQL PubSub singleton
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── (auth)/          # Login, Register, Forgot Password
│           │   ├── (customer)/      # Dashboard, My Tickets, Create, Conversation
│           │   ├── (agent)/         # Queue, Ticket Workspace (3-col hero)
│           │   ├── (supervisor)/    # Dashboard, Analytics
│           │   └── (admin)/         # Users, Teams, Routing, SLA, Security
│           ├── modules/             # Micro-frontend feature modules
│           │   ├── tickets/         # components/ hooks/ queries/ types.ts
│           │   ├── messages/
│           │   ├── auth/
│           │   ├── sla/
│           │   ├── routing/
│           │   └── analytics/
│           ├── components/ui/       # Shared shadcn/ui wrappers
│           ├── lib/                 # Apollo client, utils, constants
│           └── store/               # Zustand (auth only)
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
| **1 — Foundation & Auth** | Auth screens, JWT + refresh tokens, role-aware layout, security stack | 🔵 In progress |
| **2 — Ticket Engine** | Create ticket, routing engine, SLA start, ticket list + conversation | 🔲 Planned |
| **3 — Workspace & Real-time** | 3-column agent workspace, GraphQL Subscriptions, live SLA timer | 🔲 Planned |
| **4 — Automation & Admin** | SLA cron, CSAT, admin routing UI, Knowledge Base | 🔲 Planned |
| **5 — Analytics & Polish** | Analytics dashboard, security dashboard, mobile, demo data | 🔲 Planned |

See [`PLAN.md`](./PLAN.md) for the full architecture blueprint.

---

## Auto-Ticket Lifecycle

```
Submit → Validate → Spam Check → #ZEN-XXXX assigned
→ Routing Engine (Category/Keyword/Priority rules) → Team assigned
→ SLA timer starts → Notifications sent
→ Agent picks up → IN_PROGRESS → SLA response clock stops
→ [Cron: every 2min] SLA 80% → warning | SLA breached → escalate
→ Agent resolves → RESOLVED → CSAT survey sent
→ 48h later → AUTO-CLOSED
```

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

# Tickets (paginated, filtered, role-scoped)
query GetTickets($filter: TicketFilter, $page: Int) {
  tickets(filter: $filter, page: $page, pageSize: 20) {
    tickets { id ticketNumber title status priority slaResolutionDueAt isBookmarked }
    total totalPages
  }
}

# Real-time: new message
subscription OnMessageAdded($ticketId: Int!) {
  messageAdded(ticketId: $ticketId) {
    id body type sender { name } createdAt
  }
}

# Bookmark a node
mutation BookmarkTicket($nodeId: Int!) {
  bookmarkNode(input: { nodeType: "Ticket", nodeId: $nodeId, label: "Priority bug" }) {
    id label color
  }
}
```

---

## Token Saving

This project is set up to minimise AI token usage across every session.

| Method | Saving | Setup |
|--------|--------|-------|
| **Token Savior MCP** | ~80% active tokens | See `.cursor/mcp.json` — restart Cursor |
| **Apollo APQ** | ~60% query bandwidth | Auto — configured in `apollo-client.ts` |
| **Cursor Rules** | Prevents full-file reads | Auto — `.cursor/rules/` |

```bash
# Activate Token Savior Bash compaction
pip install "token-savior-recall[mcp]"
export TS_BASH_COMPACT=1 && export TS_BASH_REWRITE=1
ts init --agent cursor --yes
```

---

## Roadmap (post Phase 5)

- [ ] Email notifications (SendGrid / Resend)
- [ ] File attachments (Cloudflare R2)
- [ ] Apollo Federation (split into microservices)
- [ ] AI classification (OpenAI / Groq adapter — architecture already ready)
- [ ] Voice-to-text ticket creation (Browser Web Speech API)
- [ ] Mobile app (React Native)
- [ ] SSO / SAML (enterprise auth)

---

*README updates with every phase. Last updated: Phase 1 — Foundation & Auth.*

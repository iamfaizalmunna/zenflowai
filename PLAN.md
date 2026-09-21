# ZenFlowAI — Master Build Plan

> **Principle:** Simple. Minimal. Solid. Scalable. Every decision earns its complexity.

---

## 0. Token Saving Setup (Do This First)

Before we write a line of code, set up token compression so every AI session uses 60–80% fewer tokens.

### Install Token Savior (MCP — works with Cursor)

```bash
pip install "token-savior-recall[mcp]"
```

Add to `.cursor/mcp.json` (project-level):

```json
{
  "mcpServers": {
    "token-savior": {
      "command": "uvx",
      "args": ["token-savior"],
      "env": {
        "WORKSPACE_ROOTS": "/Users/faizal.sabreen/Documents/test/ZenFlowAI",
        "TOKEN_SAVIOR_CLIENT": "cursor",
        "TOKEN_SAVIOR_PROFILE": "optimized"
      }
    }
  }
}
```

Enable Bash compaction (reduces terminal output tokens by 80%):

```bash
export TS_BASH_COMPACT=1
export TS_BASH_REWRITE=1
ts init --agent cursor --yes
```

**What this gives you:**
- Cursor navigates your codebase by symbol map instead of reading whole files
- 80% fewer active tokens per session
- Persistent memory across sessions (decisions, conventions, bugfixes remembered)
- Zero inference cost — purely structural

### Also add to `.cursor/rules/token-saving.mdc`

```
Always navigate code by symbol, not by reading whole files.
Use get_function / find_symbol instead of Read on large files.
Prefer targeted edits over full-file rewrites.
```

---

## 1. Core Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **Simple over clever** | If you need a comment to explain it, simplify it |
| **DRY + Functional** | Create once, abstract, reuse everywhere. No copy-paste logic |
| **Minimal cognitive load** | One file = one responsibility. Names are self-documenting |
| **100% TypeScript** | No `any` unless bridging a 3rd-party. Types = free tests |
| **Modular = replaceable** | Every module can be swapped without touching others |
| **Scalable architecture** | Vertical scale first (bigger server), horizontal ready (stateless API) |
| **Micro-frontend** | Each feature area is an independent Next.js module |
| **Test minimally, test solidly** | TypeScript + Zod catch 70% of bugs. Unit test only pure logic |

---

## 2. What We're Building

> **ZenFlowAI** — A clean, fast, AI-ready service desk. Think Zendesk × Linear.
>
> General IT/customer support. Medium scale. Rule-engine first. AI adapter ready.

---

## 3. Role Hierarchy

```
CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN
```

| Permission | Customer | Agent | Supervisor | Admin | Super Admin |
|------------|:--------:|:-----:|:----------:|:-----:|:-----------:|
| Submit ticket | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | — | — | — | — |
| View team queue | — | ✅ | ✅ | ✅ | ✅ |
| Reply to ticket | ✅ | ✅ | ✅ | ✅ | ✅ |
| Internal notes | — | ✅ | ✅ | ✅ | ✅ |
| Assign tickets | — | Limited* | ✅ | ✅ | ✅ |
| Change SLA | — | — | ✅ | ✅ | ✅ |
| Escalate | — | ✅ | ✅ | ✅ | ✅ |
| Manage users | — | — | — | ✅ | ✅ |
| Configure routing | — | — | ✅ | ✅ | ✅ |
| Analytics | — | Limited* | ✅ | ✅ | ✅ |
| Ban/flag users | — | — | — | ✅ | ✅ |
| System config | — | — | — | — | ✅ |

*Agent: can assign only within their own team. Can see own-team analytics only.

---

## 4. Security Architecture — Layer by Layer

Simple. Clear-cut. Each layer has one job.

```
Request
   │
   ▼
[L1] HTTP Headers       ← Helmet (CSP, HSTS, X-Frame-Options)
   │
   ▼
[L2] Rate Limiting      ← express-rate-limit (per IP, per role)
   │
   ▼
[L3] IP Blocklist       ← DB lookup, blocks known bad actors
   │
   ▼
[L4] Bot Detection      ← UA fingerprint + behaviour patterns
   │
   ▼
[L5] Auth Token         ← JWT verify, expiry, session validity check
   │
   ▼
[L6] RBAC               ← Role → Permission check per resolver
   │
   ▼
[L7] Data Scoping       ← Customer sees only own data (enforced in query)
   │
   ▼
[L8] Input Sanitisation ← Zod schema validation + XSS strip
   │
   ▼
[L9] Spam Detection     ← Heuristic scoring (velocity, patterns, similarity)
   │
   ▼
[L10] Audit Log         ← Every write action logged (immutable)
   │
   ▼
Response
```

**JWT Strategy:**
- Short-lived access token: 15 minutes
- Refresh token: 7 days (HTTP-only cookie, not in localStorage)
- Token contains: `{ userId, role, sessionId }`
- Session validated against DB on every request (catches banned/deleted users instantly)
- Role is always read from DB, never trusted from JWT alone

**Database Security:**
- Passwords: bcrypt (cost factor 12)
- All IDs: auto-increment (no UUIDs in URLs — use ticket_number `#ZEN-1042` instead)
- Sensitive fields encrypted at rest: `password`, `twoFactorSecret`, `passwordResetToken`
- Row-level scoping enforced in Prisma queries, not just resolvers

---

## 5. Database Schema — Every Table

Clean. No redundancy. Clear relationships.

```prisma
// ── USERS & AUTH ─────────────────────────────────────────────────

User
  id, email (unique), name, password (bcrypt), role
  isActive, isBanned, banReason
  failedLoginCount, lockedUntil
  emailVerified, twoFactorEnabled
  lastLoginAt, lastLoginIp, registeredIp
  createdAt, updatedAt

UserSession
  id (uuid), userId, tokenHash, ip, userAgent
  isRevoked, expiresAt, lastSeenAt

RefreshToken
  id, userId, tokenHash (HTTP-only cookie), expiresAt, isRevoked

// ── TEAMS ────────────────────────────────────────────────────────

Team
  id, name, description, isDefault
  createdAt, updatedAt

TeamMember
  teamId, userId, isLead
  (composite PK)

// ── CATEGORIES & ROUTING ─────────────────────────────────────────

Category
  id, name, description, color
  defaultPriority (LOW|MEDIUM|HIGH|URGENT)
  defaultTeamId (FK → Team)
  createdAt, updatedAt

RoutingRule
  id, type (CATEGORY|KEYWORD|PRIORITY)
  categoryId?, keyword?, priority?
  targetTeamId (FK → Team)
  priorityOverride (LOW|MEDIUM|HIGH|URGENT)?
  order (evaluated in ascending order)
  isActive, createdAt

// ── SLA ──────────────────────────────────────────────────────────

SlaPolicy
  id, priority (UNIQUE)
  responseTimeHours   // time to first reply
  resolutionTimeHours // time to full resolution
  isActive

// ── TICKETS ──────────────────────────────────────────────────────

Ticket
  id (internal)
  ticketNumber (#ZEN-XXXX, generated, unique)
  title, description (text)
  status (NEW|OPEN|IN_PROGRESS|ON_HOLD|RESOLVED|CLOSED)
  priority (LOW|MEDIUM|HIGH|URGENT)
  type (BUG|FEATURE|QUESTION|INCIDENT|TASK)

  // Relations
  customerId (FK → User)
  teamId (FK → Team)
  assignedToId (FK → User, nullable)
  categoryId (FK → Category, nullable)

  // SLA
  slaResponseDueAt    // first reply deadline
  slaResolutionDueAt  // resolution deadline
  firstRespondedAt    // when agent first replied (nullable)
  resolvedAt, closedAt

  // Flags
  slaResponseBreached (bool)
  slaResolutionBreached (bool)
  isSpamFlagged (bool)
  aiClassificationScore (float)

  createdAt, updatedAt

TicketTag
  ticketId, tagId (composite PK)

Tag
  id, name, color, createdAt

// ── MESSAGES ─────────────────────────────────────────────────────

TicketMessage
  id
  ticketId (FK → Ticket)
  senderId (FK → User)
  body (text)
  type (REPLY|INTERNAL_NOTE|SYSTEM_EVENT)
  // SYSTEM_EVENT = auto-generated: "Status changed to Resolved"
  isRead (bool, for customer)
  createdAt, updatedAt

Attachment
  id, ticketId, messageId (nullable)
  filename, storagePath, mimeType, sizeBytes
  uploadedById (FK → User)
  createdAt

// ── KNOWLEDGE BASE ───────────────────────────────────────────────

KnowledgeArticle
  id, title, body (text, markdown)
  visibility (PUBLIC|INTERNAL)
  categoryId (nullable)
  authorId (FK → User)
  viewCount, isPublished
  createdAt, updatedAt

// ── CSAT ─────────────────────────────────────────────────────────

CsatSurvey
  id, ticketId (unique — one per ticket)
  customerId (FK → User)
  rating (1–5, nullable until submitted)
  comment (text, nullable)
  status (PENDING|SUBMITTED|EXPIRED)
  sentAt, submittedAt, expiresAt (sentAt + 7 days)

// ── NOTIFICATIONS ─────────────────────────────────────────────────

Notification
  id, userId (FK → User)
  type (TICKET_CREATED|REPLY|ASSIGNED|SLA_WARNING|SLA_BREACH|CSAT|SYSTEM)
  ticketId (nullable)
  title, body
  isRead, createdAt

// ── WEBHOOKS ─────────────────────────────────────────────────────

Webhook
  id, url, secret (HMAC signing key)
  events (JSON array: ["ticket.created", "ticket.resolved", ...])
  isActive, createdAt

WebhookDelivery
  id, webhookId, event, payload (JSON)
  status (PENDING|SUCCESS|FAILED), httpStatus
  attempts, lastAttemptAt, nextRetryAt

// ── ROUTING ENGINE AUDIT ─────────────────────────────────────────

RoutingDecision
  id, ticketId
  ruleId (which rule matched, nullable = fallback)
  assignedTeamId, assignedUserId (nullable)
  reason (text)
  createdAt

// ── SECURITY ─────────────────────────────────────────────────────

AuditLog           // every write action, immutable
  id, action, category (AUTH|ACCESS|TICKET|SECURITY|ADMIN)
  severity (INFO|WARN|ERROR|CRITICAL)
  actorId, actorIp, actorAgent
  targetType, targetId
  message, metadata (JSON), createdAt

BlockedIp
  id, ip (unique), reason, expiresAt (null = permanent), createdAt

RateLimitViolation
  id, ip, userId?, endpoint, violationType, createdAt

CooldownPeriod
  id, userId, action, endsAt, createdAt

UsageQuota         // per-user rolling window counters
  userId (unique)
  ticketsThisHour, ticketsToday
  commentsThisHour, commentsToday
  hourWindowStart, dayWindowStart

SpamReport
  id, targetType, targetId
  aiScore (0–1), aiFlags (JSON)
  status (PENDING|CONFIRMED|DISMISSED|AUTO_BLOCKED)
  createdAt

PermissionOverride
  id, userId, permission, granted (bool)
  grantedById, reason, expiresAt, createdAt
```

---

## 6. Auto-Ticket Lifecycle

```
Customer submits
      │
      ▼
Validate (Zod) + Sanitise
      │
      ▼
Spam check (score < 60 → proceed, ≥ 60 → hold/block)
      │
      ▼
Generate #ZEN-XXXX
      │
      ▼
Routing Engine → Category → Team → Agent (round-robin)
      │
      ▼
SLA policy lookup → set slaResponseDueAt + slaResolutionDueAt
      │
      ▼
Status = NEW
      │
      ▼
Notification → assigned agent + team
Notification → customer (confirmation)
      │
      ▼
──── AGENT PICKS UP ────
      │
      ▼
Status = IN_PROGRESS, firstRespondedAt = now()
SLA response clock stops
      │
      ▼
──── CRON JOB (every 2 min) ────
      │
      ├─ slaResolutionDueAt - 20% remaining → WARN agent + supervisor
      ├─ slaResolutionDueAt passed → BREACH → escalate to supervisor
      └─ resolved tickets > 48h → AUTO-CLOSE
      │
      ▼
──── AGENT RESOLVES ────
      │
      ▼
Status = RESOLVED, resolvedAt = now()
Notify customer
CSAT survey created (expires in 7 days)
      │
      ▼
Customer can reopen (within 24h window)
      │
      ▼
48h later → AUTO-CLOSE
CSAT expires (if not submitted)
```

---

## 7. Routing Engine (Simple, DB-Driven)

```
RoutingEngine.evaluate(ticket)

  Step 1: Load active rules ORDER BY "order" ASC
  Step 2: Evaluate each rule:
          CATEGORY rule: does ticket.categoryId match? → assign team
          KEYWORD rule:  does title OR description contain keyword? → assign team
          PRIORITY rule: does ticket.priority match? → assign team
          (first match wins, logs RoutingDecision)
  Step 3: If no rule matches → fallback to default team
  Step 4: Within the team → find agent with fewest open assigned tickets
          (round-robin by workload, not just order)
  Step 5: Log RoutingDecision for audit trail
```

**Example rules (seeded):**

| Order | Type | Match | → Team | Priority Override |
|-------|------|-------|--------|-------------------|
| 1 | KEYWORD | "urgent", "down", "outage" | Tier-2 Support | URGENT |
| 2 | CATEGORY | Billing | Finance Team | HIGH |
| 3 | CATEGORY | Technical | IT Support | — |
| 4 | PRIORITY | URGENT | Tier-2 Support | — |
| 5 | FALLBACK | (always) | General Support | — |

---

## 8. Real-Time — 4 GraphQL Subscriptions

```graphql
# 1. New message in ticket (customer + agent both listen)
messageAdded(ticketId: Int!): TicketMessage

# 2. Ticket metadata changed (status, priority, assignee)
ticketUpdated(ticketId: Int!): TicketUpdateEvent

# 3. New ticket arrived in queue (agents see this)
ticketCreated: TicketSummary

# 4. SLA alert (supervisors + admins see this)
slaAlert: SlaAlertEvent
```

Implementation: Apollo GraphQL Subscriptions over WebSocket (`graphql-ws`).
No Socket.io. No Pusher. Pure GraphQL.

---

## 9. AI Adapter (Plug-in Pattern)

```
aiService/
  adapter.interface.ts    ← never changes
  ruleBasedAdapter.ts     ← what we build (always works, no key)
  openAIAdapter.ts        ← plug in when ready
  groqAdapter.ts          ← plug in when ready
  index.ts                ← factory: reads AI_PROVIDER env var
```

**Interface (locked):**

```typescript
interface AIAdapter {
  classifyTicket(title: string, desc: string): Promise<{
    category: string; priority: string; confidence: number;
  }>
  summarize(messages: TicketMessage[]): Promise<string>
  suggestReply(ticket: Ticket, messages: TicketMessage[]): Promise<string>
  findSimilar(title: string, desc: string): Promise<TicketSummary[]>
}
```

**Rule-based fallbacks (no API key needed):**

| Method | Fallback |
|--------|----------|
| `classifyTicket` | Keyword matching against category names |
| `summarize` | First 200 chars of description |
| `suggestReply` | Template per category (e.g. "Thank you for contacting us about [category]...") |
| `findSimilar` | MySQL `LIKE` search on title/description |

---

## 10. Micro-Frontend Structure

Each route group is a self-contained module with its own components, hooks, and types.

```
apps/frontend/src/
│
├── app/                          ← Next.js App Router
│   ├── (auth)/                   ← Auth module (login, register, reset)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (customer)/               ← Customer module
│   │   ├── dashboard/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── tickets/[id]/page.tsx
│   │   ├── tickets/new/page.tsx
│   │   └── knowledge/page.tsx
│   │
│   ├── (agent)/                  ← Agent module
│   │   ├── queue/page.tsx
│   │   ├── tickets/[id]/page.tsx ← 3-column workspace
│   │   └── knowledge/page.tsx    ← internal guides
│   │
│   ├── (supervisor)/             ← Supervisor module
│   │   ├── dashboard/page.tsx
│   │   └── analytics/page.tsx
│   │
│   └── (admin)/                  ← Admin module
│       ├── users/page.tsx
│       ├── teams/page.tsx
│       ├── routing/page.tsx
│       ├── sla/page.tsx
│       └── security/page.tsx
│
├── modules/                      ← Feature modules (micro-frontend units)
│   ├── tickets/
│   │   ├── components/           ← TicketCard, TicketStatus, SLATimer
│   │   ├── hooks/                ← useTicket, useTicketList, useCreateTicket
│   │   ├── queries/              ← gql fragments + operations
│   │   └── types.ts
│   │
│   ├── messages/
│   │   ├── components/           ← MessageBubble, ReplyBox, InternalNote
│   │   ├── hooks/                ← useMessages, useSendMessage
│   │   └── queries/
│   │
│   ├── auth/
│   │   ├── components/           ← LoginForm, RegisterForm
│   │   ├── hooks/                ← useAuth, useSession
│   │   └── guards/               ← RoleGuard, AuthGuard
│   │
│   ├── routing/
│   │   ├── engine/               ← routingEngine.ts (pure function)
│   │   └── components/           ← RoutingRuleList, RuleEditor
│   │
│   ├── sla/
│   │   ├── SLATimer.tsx          ← live countdown
│   │   ├── hooks/useCountdown.ts
│   │   └── slaPolicy.ts          ← pure helpers
│   │
│   ├── ai/
│   │   └── hooks/useAiAssist.ts  ← wraps AI adapter calls
│   │
│   ├── analytics/
│   │   ├── components/           ← Charts, MetricCard
│   │   └── hooks/useAnalytics.ts
│   │
│   └── notifications/
│       ├── NotificationBell.tsx
│       └── hooks/useNotifications.ts
│
├── components/                   ← Shared UI (shadcn/ui wrappers)
│   └── ui/                       ← Button, Badge, Card, etc.
│
├── lib/                          ← Pure utilities (no side effects)
│   ├── apollo.ts                 ← Apollo client singleton
│   ├── utils.ts                  ← cn(), formatDate(), etc.
│   └── constants.ts              ← STATUS_COLORS, PRIORITY_LABELS, etc.
│
├── hooks/                        ← Global hooks (useTheme, useUser)
└── store/                        ← Zustand (auth only)
```

**Rule:** No module imports from another module's internals. Only through shared `lib/` or `components/`.

---

## 11. Backend Structure (Modular, DRY)

```
apps/backend/src/
│
├── graphql/
│   ├── schemas/                  ← typeDefs split by domain
│   │   ├── ticket.schema.ts
│   │   ├── user.schema.ts
│   │   ├── message.schema.ts
│   │   ├── routing.schema.ts
│   │   ├── sla.schema.ts
│   │   ├── analytics.schema.ts
│   │   └── index.ts              ← merge all
│   │
│   └── resolvers/                ← one resolver per domain
│       ├── ticket.resolver.ts
│       ├── user.resolver.ts
│       ├── message.resolver.ts
│       ├── routing.resolver.ts
│       ├── sla.resolver.ts
│       ├── analytics.resolver.ts
│       ├── subscription.resolver.ts
│       └── index.ts
│
├── services/                     ← Business logic (pure, testable)
│   ├── ticket.service.ts
│   ├── routing.service.ts        ← RoutingEngine
│   ├── sla.service.ts            ← SLA calculator + breach checker
│   ├── notification.service.ts
│   ├── webhook.service.ts
│   ├── csat.service.ts
│   └── ai/
│       ├── adapter.interface.ts
│       ├── ruleBasedAdapter.ts
│       └── index.ts
│
├── security/
│   ├── rbac.ts                   ← permissions map + requirePermission()
│   ├── audit.ts                  ← audit() helper
│   ├── spamDetector.ts           ← analyzeContent()
│   ├── fairUsage.ts              ← checkQuota() + checkCooldown()
│   └── httpSecurity.ts           ← middleware stack
│
├── jobs/                         ← Background workers
│   └── slaChecker.ts             ← node-cron, runs every 2 min
│
├── middleware/
│   └── auth.ts                   ← buildContext() → JWT → session check
│
├── utils/
│   ├── prisma.ts                 ← singleton
│   ├── pubsub.ts                 ← GraphQL PubSub singleton
│   └── ticket.ts                 ← generateTicketNumber()
│
└── types/
    └── context.ts                ← Context interface
```

**Rule:** Resolvers only call services. Services only call Prisma and other services. Zero business logic in resolvers.

---

## 12. The 3-Column Ticket Workspace

```
┌─────────────────┬──────────────────────────────┬──────────────────┐
│  TICKET INFO    │  CONVERSATION                │  ACTIONS         │
│  (280px fixed)  │  (flex — scrollable)         │  (320px fixed)   │
├─────────────────┼──────────────────────────────┼──────────────────┤
│                 │                              │                  │
│  #ZEN-1042      │  [Customer reply]            │  STATUS          │
│  "Login error"  │  "I can't log in since..."   │  ┌────────────┐  │
│                 │                              │  │In Progress ▼│  │
│  ─────────────  │  [System event]              │  └────────────┘  │
│  CUSTOMER       │  Assigned to Sarah           │                  │
│  Alex Johnson   │                              │  PRIORITY        │
│                 │  [Agent reply]               │  ┌────────────┐  │
│  STATUS         │  "I've reset your password"  │  │High       ▼│  │
│  🟡 In Progress │                              │  └────────────┘  │
│                 │  [Internal note 🔒]           │                  │
│  PRIORITY       │  "Customer has 2FA issue"    │  ASSIGNEE        │
│  🔴 High        │                              │  ┌────────────┐  │
│                 │  ─────────────────────────   │  │Sarah M.   ▼│  │
│  SLA            │                              │  └────────────┘  │
│  ████░░ 01:42   │  REPLY BOX                   │                  │
│  (yellow)       │  ┌──────────────────────┐    │  TEAM            │
│                 │  │                      │    │  ┌────────────┐  │
│  TEAM           │  │ Type your reply...   │    │  │IT Support ▼│  │
│  IT Support     │  │                      │    │  └────────────┘  │
│                 │  └──────────────────────┘    │                  │
│  ASSIGNED       │                              │  CATEGORY        │
│  Sarah M.       │  [Reply] [Internal Note]     │  ┌────────────┐  │
│                 │                              │  │Technical  ▼│  │
│  CATEGORY       │                              │  └────────────┘  │
│  Technical      │                              │                  │
│                 │                              │  ─────────────── │
│  CREATED        │                              │  QUICK ACTIONS   │
│  2h ago         │                              │  [✓ Resolve]     │
│                 │                              │  [↑ Escalate]    │
│  ─────────────  │                              │  [→ Transfer]    │
│  ACTIVITY       │                              │  [✕ Close]       │
│  ▼ (collapsed)  │                              │                  │
│                 │                              │  ─────────────── │
│                 │                              │  AI ASSIST       │
│                 │                              │  [Summarise]     │
│                 │                              │  [Suggest Reply] │
│                 │                              │                  │
│                 │                              │  ─────────────── │
│                 │                              │  SIMILAR         │
│                 │                              │  #ZEN-1039 ↗     │
│                 │                              │  #ZEN-1021 ↗     │
└─────────────────┴──────────────────────────────┴──────────────────┘
```

**Mobile:** Collapses to 3 tabs (Info | Conversation | Actions). Conversation is default.

---

## 13. Analytics — 6 Metrics

| Metric | Chart Type | Data |
|--------|-----------|------|
| Ticket volume | Line chart (daily/weekly/monthly) | count by date |
| SLA compliance | Gauge + % trend | breached / total |
| Avg resolution time | Bar chart by team/agent | avg(resolvedAt - createdAt) |
| Agent performance | Ranked list | tickets resolved, avg CSAT, avg response time |
| CSAT score | Star distribution + avg | avg(rating), count per star |
| Category breakdown | Donut chart | count by category |

All computed with Prisma `groupBy` + `_avg` — no separate analytics DB needed at this scale.

---

## 14. CSAT Flow

```
Ticket resolved
       ↓
CsatSurvey created (status=PENDING, expiresAt = now+7days)
       ↓
Notification to customer: "Rate your experience with #ZEN-1042"
       ↓
Customer sees banner on dashboard (dismissible)
       ↓
Clicks → rating modal (1–5 stars + optional comment)
       ↓
CsatSurvey updated (status=SUBMITTED, rating, submittedAt)
       ↓
Cron: after 7 days, PENDING surveys → EXPIRED

Analytics: avg by team, agent, category, period
```

---

## 15. Webhooks

Events exposed:

```
ticket.created       ticket.updated      ticket.resolved
ticket.closed        ticket.assigned     ticket.escalated
message.created      sla.warning         sla.breached
```

Delivery: HTTPS POST, signed with HMAC-SHA256 (`X-ZenFlow-Signature` header).
Retry: 3 attempts with exponential backoff. Stored in `WebhookDelivery` for debugging.

---

## 16. 16 Screens

| # | Screen | Module | Role |
|---|--------|--------|------|
| 1 | Login | auth | All |
| 2 | Register | auth | All |
| 3 | Forgot/Reset Password | auth | All |
| 4 | Customer Dashboard | customer | Customer |
| 5 | Create Ticket | customer | Customer |
| 6 | My Tickets | customer | Customer |
| 7 | Ticket Conversation | customer | Customer |
| 8 | Public Knowledge Base | customer | Customer |
| 9 | Agent Queue | agent | Agent+ |
| 10 | **Ticket Workspace (3-col)** | agent | Agent+ |
| 11 | Internal Knowledge Base | agent | Agent+ |
| 12 | Supervisor Dashboard | supervisor | Supervisor+ |
| 13 | Analytics | supervisor | Supervisor+ |
| 14 | Users & Teams | admin | Admin+ |
| 15 | Routing Rules + SLA Config | admin | Admin+ |
| 16 | Security Dashboard | admin | Admin+ |

---

## 17. Unit Testing Strategy (Minimal, Solid)

**TypeScript + Zod = ~70% of bugs caught at compile time.**

Test only what TypeScript can't: pure business logic functions.

```
What to test:
  ✅ routingEngine.evaluate()     — pure function, critical path
  ✅ slaService.calculateDueAt()  — pure function, date math
  ✅ spamDetector.analyzeContent()— pure function, scoring
  ✅ rbac.hasPermission()         — pure function, security critical
  ✅ generateTicketNumber()       — pure function, format validation

What NOT to test:
  ❌ GraphQL resolvers (integration test territory)
  ❌ Express middleware (covered by security layer e2e)
  ❌ UI components (TypeScript + manual testing sufficient for MVP)
  ❌ Prisma queries (covered by DB constraints + types)
```

Framework: **Vitest** (same config as Vite, zero setup, ESM-native).

---

## 18. Token Saving — Summary of Repos Used

| Repo | What it does | How to use |
|------|-------------|-----------|
| **Token Savior** (MIT) | MCP: Cursor reads codebase by symbol map, not raw files. -80% tokens. Persistent memory. | Add to `.cursor/mcp.json` |
| **Claw Compactor** (MIT) | 14-stage pipeline: compresses JSON/code/logs before sending to AI. 15–82% reduction. Zero inference cost. | Use as pre-processor for any large context you send to AI |
| **Apollo APQ** (built-in) | Sends SHA-256 hash instead of full GraphQL query. Already configured. | Already in our apollo-client.ts |
| **Prisma** (schema-first) | Schema + types generated = never paste schema into AI context again | Already in use |
| **TypeScript strict** | Strong types = AI needs less context to understand code | Already configured |

**Also use these Cursor practices to save tokens:**
- Use `get_function` / `find_symbol` (Token Savior MCP) instead of reading whole files
- Always read only the specific lines you need, not full files
- Use `@codebase` sparingly — prefer specific file references
- Add this rule to `.cursor/rules/`:

```
Prefer symbol-level navigation over reading full files.
When editing, show only changed sections, not full file content.
Abstract repeated patterns into shared utilities before implementing.
```

---

## 19. Phase-Based Build Plan (5 Phases → 5 GitHub Pushes)

Each phase ends with a working, deployable product. Nothing is half-done at push time.

---

### PHASE 1 — Foundation & Auth
**Branch:** `phase/1-foundation`
**Push when:** Login works end-to-end. Role-based layout renders correctly.

#### Backend
- [ ] Prisma schema — full rewrite (all tables from Section 5)
- [ ] DB migration + seed (5 users across all roles, SLA policies, routing rules, categories)
- [ ] JWT auth service: login, register, refresh token, logout
- [ ] Auth resolvers: `login`, `register`, `me`, `refreshToken`, `logout`
- [ ] GraphQL schema: User, AuthPayload, basic types
- [ ] Security stack wired: Helmet, rate limiter, bot detection, IP blocklist, audit log
- [ ] `requirePermission()` guard on every protected resolver

#### Frontend
- [ ] App Router layout: root layout, font, theme provider
- [ ] Role-aware sidebar (collapses per role — customer sees 4 items, agent sees 8, etc.)
- [ ] Auth module: Login screen, Register screen, Forgot Password screen
- [ ] JWT + refresh token flow (15min access, 7d refresh cookie)
- [ ] Role guard: `AuthGuard`, `RoleGuard` components
- [ ] Route protection (redirect unauthorized users)
- [ ] Zustand auth store (token + user only)

#### Deliverable at push
```
✅ Login / Register / Forgot Password (all 3 auth screens)
✅ Redirects work per role after login
✅ Security headers present (check devtools)
✅ JWT refresh works (auto-renews on expiry)
✅ Audit log records LOGIN_SUCCESS / LOGIN_FAILED
```

**Git push:** `git push origin phase/1-foundation` → PR → merge → `main`

---

### PHASE 2 — Ticket Engine
**Branch:** `phase/2-ticket-engine`
**Push when:** Customer can submit a ticket and see it. Agent can see their queue.

#### Backend
- [ ] Ticket service: `createTicket`, `getTicket`, `listTickets`, `updateTicket`
- [ ] Routing engine: `RoutingEngine.evaluate()` (pure service, tested)
- [ ] SLA service: `calculateDueAt()`, store `slaResponseDueAt` + `slaResolutionDueAt`
- [ ] Ticket resolvers: `createTicket`, `tickets`, `ticket`, `updateTicket`, `assignTicket`, `resolveTicket`
- [ ] Message resolvers: `addMessage`, `messages` (REPLY + INTERNAL_NOTE + SYSTEM_EVENT)
- [ ] Ticket number generator: `#ZEN-0001` format
- [ ] Spam detection on `createTicket` (block/flag before saving)
- [ ] Fair usage quotas on ticket creation (per role)
- [ ] Category, Tag, Team resolvers (read-only)
- [ ] Routing decision logged to `RoutingDecision` table

#### Frontend
- [ ] Customer: Create Ticket screen (form + Zod validation)
- [ ] Customer: My Tickets list (own tickets only)
- [ ] Customer: Ticket Conversation view (messages, status badge, SLA display)
- [ ] Customer: Dashboard (open/waiting/resolved counts + recent tickets)
- [ ] Agent: Queue screen (all team tickets, filters: status/priority)
- [ ] Shared: `TicketCard`, `StatusBadge`, `PriorityBadge`, `TicketNumber` components
- [ ] Shared: `useTicket`, `useTicketList`, `useCreateTicket` hooks

#### Deliverable at push
```
✅ Customer submits ticket → #ZEN-XXXX assigned
✅ Routing engine assigns correct team
✅ SLA due dates stored correctly
✅ Agent sees ticket in queue
✅ Customer sees their own tickets only
✅ Spam detection blocks obvious spam
```

**Git push:** `git push origin phase/2-ticket-engine` → PR → merge → `main`

---

### PHASE 3 — Agent Workspace & Real-Time
**Branch:** `phase/3-workspace-realtime`
**Push when:** The 3-column workspace works live. Messages appear in real time.

#### Backend
- [ ] GraphQL Subscriptions setup (`graphql-ws`, PubSub singleton)
- [ ] `messageAdded(ticketId)` subscription
- [ ] `ticketUpdated(ticketId)` subscription
- [ ] `ticketCreated` subscription (for agent queue)
- [ ] `slaAlert` subscription (for supervisor)
- [ ] Notification service: create notification on ticket events
- [ ] Notification resolvers: `notifications`, `markRead`, `markAllRead`

#### Frontend
- [ ] **3-column Ticket Workspace** (hero screen — agent view)
  - Left: ticket info, customer, SLA countdown, activity log
  - Center: message thread (REPLY visible to all, INTERNAL_NOTE hidden from customer)
  - Right: action panel (status, priority, assign, escalate, resolve)
- [ ] Live SLA countdown timer (`useCountdown` hook)
- [ ] Real-time messages via `messageAdded` subscription
- [ ] Real-time ticket updates via `ticketUpdated` subscription
- [ ] Agent queue: live `ticketCreated` subscription (new ticket appears without refresh)
- [ ] Supervisor Dashboard: SLA alerts via `slaAlert` subscription
- [ ] Notification bell (in header, shows unread count, live updates)
- [ ] AI Assist buttons: Summarise + Suggest Reply (rule-based fallback, no key needed)

#### Deliverable at push
```
✅ 3-column workspace renders, all panels functional
✅ Agent sends reply → customer sees it instantly (no refresh)
✅ Internal notes hidden from customer view
✅ SLA timer counts down live, turns yellow/red at thresholds
✅ New ticket appears in agent queue in real time
✅ Notification bell shows live unread count
✅ AI assist returns rule-based suggestion
```

**Git push:** `git push origin phase/3-workspace-realtime` → PR → merge → `main`

---

### PHASE 4 — Automation, Admin & Knowledge Base
**Branch:** `phase/4-automation-admin`
**Push when:** SLA escalation fires automatically. Admin can configure routing from the UI.

#### Backend
- [ ] SLA cron job (`node-cron`, every 2 min):
  - SLA 80% → warning notification to agent + supervisor
  - SLA breached → escalation notification + `slaResolutionBreached = true`
  - RESOLVED tickets > 48h → auto-close
- [ ] CSAT service: create survey on resolve, expire after 7d
- [ ] CSAT resolvers: `submitCsat`, `myCsatSurveys`
- [ ] Webhook service: emit events + HMAC signing + retry logic
- [ ] Admin resolvers: `createUser`, `updateUser`, `banUser`, `createTeam`, `addTeamMember`
- [ ] Routing admin resolvers: `createRoutingRule`, `updateRoutingRule`, `deleteRoutingRule`, `reorderRules`
- [ ] SLA admin resolvers: `updateSlaPolicy`
- [ ] Knowledge Base resolvers: `createArticle`, `updateArticle`, `articles`, `article`

#### Frontend
- [ ] Admin: Users & Teams screen (list, create, edit, ban, role change)
- [ ] Admin: Routing Rules UI (rule list + drag-to-reorder + create/edit form)
- [ ] Admin: SLA Policies UI (edit response/resolution times per priority)
- [ ] Customer: CSAT survey banner + rating modal (1–5 stars + comment)
- [ ] Knowledge Base — Public FAQ (customer-facing, searchable)
- [ ] Knowledge Base — Internal Guides (agent-facing, markdown rendered)
- [ ] Supervisor: CSAT analytics card (avg rating by agent/team)

#### Deliverable at push
```
✅ Cron fires: SLA breach → supervisor gets notification automatically
✅ Ticket auto-closes 48h after resolution
✅ CSAT survey appears for customer after ticket resolved
✅ Admin can add/reorder/delete routing rules in UI
✅ Admin can edit SLA times per priority
✅ Knowledge Base articles searchable by customer and agent
✅ Webhooks emit on ticket events (check delivery log)
```

**Git push:** `git push origin phase/4-automation-admin` → PR → merge → `main`

---

### PHASE 5 — Analytics, Security Dashboard & Polish
**Branch:** `phase/5-analytics-polish`
**Push when:** Full demo flow works. App looks production-ready. All 16 screens complete.

#### Backend
- [ ] Analytics resolvers:
  - `ticketVolumeByDay(period)` — line chart data
  - `slaComplianceRate` — % breached vs total
  - `avgResolutionTime(groupBy: team|agent)` — bar chart
  - `agentPerformance` — tickets resolved, avg CSAT, avg response time
  - `csatDistribution` — count per star rating + avg
  - `ticketsByCategory` — donut chart
- [ ] Security dashboard resolvers: `auditLogs`, `blockedIps`, `blockIp`, `unblockIp`, `spamReports`
- [ ] Realistic demo seed: 50+ tickets across all statuses/priorities/teams, realistic message threads

#### Frontend
- [ ] Analytics dashboard (Recharts):
  - Ticket volume line chart
  - SLA compliance gauge
  - Avg resolution time bar chart
  - Agent performance leaderboard
  - CSAT star distribution
  - Category breakdown donut
- [ ] Security dashboard (Admin):
  - Audit log table (filterable by category/severity)
  - Blocked IPs list + block/unblock action
  - Spam reports queue
- [ ] Loading skeletons on every data-fetching screen
- [ ] Empty states (no tickets, no notifications, etc.)
- [ ] Error boundaries (graceful error UI)
- [ ] Mobile responsiveness (customer screens mobile-first, agent workspace tabbed on mobile)
- [ ] Dark mode polish (everything works in both themes)
- [ ] Final security pass (check all permission guards, audit logs)

#### Deliverable at push
```
✅ All 16 screens complete and functional
✅ Analytics charts populated with realistic demo data
✅ Audit log shows every security event
✅ App works on mobile (customer side)
✅ Dark/light mode fully consistent
✅ All roles see correct data (nothing leaks cross-role)
✅ Full demo flow: Customer → Agent → Supervisor → Admin
```

**Git push:** `git push origin phase/5-analytics-polish` → PR → merge → `main`

---

### Branch Strategy Summary

```
main                    ← always stable, always deployable
  └── phase/1-foundation        ← PR when phase complete
  └── phase/2-ticket-engine     ← PR when phase complete
  └── phase/3-workspace-realtime
  └── phase/4-automation-admin
  └── phase/5-analytics-polish
```

Each phase branch is created fresh from `main`:

```bash
git checkout main
git pull origin main
git checkout -b phase/2-ticket-engine
# ... build ...
git push origin phase/2-ticket-engine
# Open PR → review → merge to main
```

### Progress Tracker

| Phase | Status | Branch | PR |
|-------|--------|--------|----|
| Phase 1 — Foundation & Auth | 🔲 Not started | `phase/1-foundation` | — |
| Phase 2 — Ticket Engine | 🔲 Not started | `phase/2-ticket-engine` | — |
| Phase 3 — Workspace & Real-Time | 🔲 Not started | `phase/3-workspace-realtime` | — |
| Phase 4 — Automation & Admin | 🔲 Not started | `phase/4-automation-admin` | — |
| Phase 5 — Analytics & Polish | 🔲 Not started | `phase/5-analytics-polish` | — |

---

## 20. Environment Variables (Complete List)

```bash
# Database
DATABASE_URL="mysql://root:password@localhost:3306/zenflowai"

# JWT
JWT_SECRET="..."          # min 32 chars, random
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Server
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:3000"

# File Storage
UPLOAD_DIR="./uploads"    # local for MVP
MAX_FILE_SIZE_MB=10

# SLA Cron
SLA_CHECK_INTERVAL_CRON="*/2 * * * *"   # every 2 minutes

# AI (optional, defaults to rule-based)
AI_PROVIDER=rule_based    # options: rule_based | openai | groq
OPENAI_API_KEY=           # leave empty for rule-based
GROQ_API_KEY=             # leave empty for rule-based

# Frontend
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_APP_NAME=ZenFlowAI
```

---

*Last updated: Day 0 — Pre-build planning complete.*
*Next: Day 1 — Token Savior setup → Prisma schema → Auth screens*

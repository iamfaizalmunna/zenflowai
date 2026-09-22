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
- Access token: 15 minutes (JWT, frontend `localStorage` today)
- Refresh token: 7 days (stored hashed in MySQL; HTTP-only cookie not wired)
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

// ── UI CUSTOMIZATION (Phase 5) ───────────────────────────────────

UiPreference          // one row per user — table ui_preferences
  userId (unique, FK → User)
  colorMode (SYSTEM|LIGHT|DARK)
  accentHex, shade (−24…24)
  finish (MATTE|GLOSSY|GLASS)
  fontFamily, fontSize (S|M|L), density
  ticketView (LIST|COMPACT|CARD|ICON)
  ticketSort (UPDATED|CREATED|SLA|PRIORITY)
  soundsMuted, logoDataUrl
  createdAt, updatedAt
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

## 10. Frontend structure (as shipped)

Each route group is a module. Shared UI lives in `components/`. Shared logic in `lib/` or `hooks/`.

```
apps/frontend/src/
├── app/
│   ├── (auth)/login|register|forgot-password
│   ├── (customer)/dashboard, tickets, tickets/new, tickets/[id], knowledge
│   ├── (agent)/queue, knowledge/internal, supervisor
│   ├── (admin)/admin/users|teams|routing|sla|knowledge
│   └── settings/page.tsx              ← Appearance studio
├── modules/auth, tickets, admin, appearance
├── components/layout (AppShell, Sidebar, MobileChrome, PWA)
├── components/ui (Field, Select, controlStyles)
├── hooks/useAppearance, useUiSound
├── lib/appearance, appearanceCore, uiSound, nav, apollo-client
└── store/auth.store.ts                ← Zustand auth only
```

**Shipped:** PWA + mobile chrome ≤1024px. **Not shipped:** `(supervisor)/analytics`, `(admin)/security`, dedicated notification bell.

**Rule:** No module imports from another module's internals. Only through shared `lib/` or `components/`.

---

## 11. Backend Structure (as shipped)

```
apps/backend/src/
├── graphql/schemas/     auth, user, ticket, knowledge, admin, csat, appearance, base
├── graphql/resolvers/   matching files + subscription
├── services/            ticket, message, routing, sla, csat, qa, appearance, admin, knowledge
├── jobs/slaCron.ts
├── security/            rbac, audit, spam, fairUsage, httpSecurity
├── middleware/auth.ts
├── utils/               prisma, pubsub, ticketNumber
└── types/context.ts
```

**Not in this tree yet:** analytics resolvers, webhook.service, AI adapter process.

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

## 16. Screens (shipped vs planned)

| Screen | Route | Status |
|--------|--------|--------|
| Login / Register / Forgot password | `/login`, `/register`, `/forgot-password` | Shipped |
| Customer home, tickets, new ticket, conversation | `/dashboard`, `/tickets`, `/tickets/new`, `/tickets/[id]` | Shipped |
| Public Help Center | `/knowledge` | Shipped |
| Agent queue + 3-col workspace | `/queue`, `/tickets/[id]` | Shipped |
| Internal guides | `/knowledge/internal` | Shipped |
| Supervisor SLA watch | `/supervisor` | Shipped (KPIs + analytics for SUPERVISOR+) |
| Admin users, teams, routing, SLA, KB drafts | `/admin/…` | Shipped |
| Appearance | `/settings` | Shipped (Phase 5) |
| Analytics infographic dashboard | `/analytics` (SUPERVISOR+) | Shipped |
| Consultant directory + profile | `/admin/consultants`, `/admin/consultants/[id]` | Shipped, ADMIN+ only |
| Security / spam review | `/admin/security` | Shipped |

---

## 17. Unit Testing Strategy (Minimal, Solid)

**TypeScript + Zod = ~70% of bugs caught at compile time.**

Test only what TypeScript can't: pure business logic functions.

```
What to test:
  ✅ routing, SLA math, spam verdicts, RBAC, ticket numbers
  ✅ related-article rank, suggest-reply templates, CSAT rules, Q&A confidence
  ✅ SLA sweep, PWA/nav contracts, UI sound policy
  ✅ appearance token merge, contrast, ticket view/sort enums

What NOT to test:
  ❌ GraphQL resolvers (keep thin)
  ❌ Prisma queries
  ❌ Full UI e2e for MVP
```

Runner: **`tsx --test`** from the backend package (`pnpm test`), including `apps/frontend/src/lib/*.test.ts`. Not Vitest.
CI (`.github/workflows/test.yml`) runs **`pnpm db:generate`** before tests so Prisma client exists. Unit tests must stay Prisma-free: do not import services that construct `PrismaClient`.

**SonarQube / SonarCloud:** `sonar-project.properties` is the project key. CI uploads coverage (`apps/backend/coverage/lcov.info`) when `SONAR_TOKEN` is set on the GitHub repo. `SONAR_HOST_URL` defaults to `https://sonarcloud.io`. KB shards and generated folders are excluded so the quality gate is not poisoned by demo JSONL.

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

## 19. Phase-Based Build Plan (6 Phases → 6 GitHub Pushes)

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

### PHASE 2 — Ticket Engine + KB Foundation
**Branch:** `phase/2-ticket-engine`
**Push when:** Customer can submit a ticket, agent can see the queue, and Help Center search works on owned articles.

#### Backend
- [x] Ticket service: `createTicket`, `getTicket`, `listTickets`, `updateTicket`
- [x] Routing engine: `matchRoutingRule()` / `evaluateRouting()` (pure matcher tested)
- [x] SLA service: `calculateDueAt()`, store `slaResponseDueAt` + `slaResolutionDueAt`
- [x] Ticket resolvers: `createTicket`, `tickets`, `ticket`, `updateTicket` (assign/resolve via `updateTicket`)
- [x] Message resolvers: `addMessage` (REPLY + INTERNAL_NOTE)
- [x] Ticket number generator: `#ZEN-0001` format
- [x] Spam detection on `createTicket` (block/flag before saving)
- [x] Fair usage quotas on ticket creation (per role)
- [x] Category resolver (read-only). Tag/Team GraphQL deferred.
- [x] Routing decision logged to `RoutingDecision` table
- [x] Knowledge article model + owned articles (chunk/version CRUD deferred to Phase 4)
- [x] Knowledge resolvers: `knowledgeArticles`, `knowledgeArticle` (`contains` search; FULLTEXT later)
- [ ] MySQL FULLTEXT search on title, summary, and chunks — Phase 3/4
- [x] Seed owned articles (6 public FAQ + internal guides; not 25–40)
- [x] Visibility filter: PUBLIC for customers, INTERNAL only for Agent+

#### Frontend
- [x] Customer: Create Ticket screen
- [x] Customer: My Tickets list (own tickets only)
- [x] Customer: Ticket Conversation view
- [x] Customer: Dashboard (counts + recent tickets)
- [x] Customer: Help Center search + article page
- [x] Agent: Queue screen
- [x] Agent: Internal Guides search
- [x] Shared: `TicketCard` (status/priority on the card; extra badge components later)
- [x] Shared: ticket GraphQL documents in `modules/tickets/queries/` (dedicated hooks later)

#### Deliverable at push
```
✅ Customer submits ticket → #ZEN-XXXX assigned
✅ Routing engine assigns a team (keyword / category / priority / fallback)
✅ SLA due dates stored
✅ Agent sees ticket in queue
✅ Customer sees their own tickets only
✅ Spam detection blocks obvious spam
✅ Help Center returns owned public articles
✅ Internal guides hidden from customers
✅ Unit tests for RBAC, spam bands, ticket number, routing, SLA
```

**Git push:** `git push origin phase/2-ticket-engine` (local + GitHub only; no cloud host)

**MVP out of scope (later phases):** crawler, GraphQL subscriptions, LLM, SLA cron, 3-column workspace.

---

### PHASE 3 — Workspace, Real-Time, KB in Tickets
**Branch:** `phase/3-workspace-realtime`
**Push when:** The 3-column workspace works live, and related KB articles appear beside a ticket.

#### Backend
- [x] GraphQL Subscriptions setup (`graphql-ws`, in-process PubSub)
- [x] `messageAdded(ticketId)` subscription
- [x] `ticketUpdated(ticketId)` subscription
- [x] `ticketCreated` subscription (for agent queue)
- [ ] `slaAlert` subscription — Phase 4 (needs cron)
- [ ] Notification resolvers: `notifications`, `markRead`, `markAllRead` — later
- [x] `relatedArticles(ticketId)` using title + description + category
- [x] `articleSnippet(articleId)` cited snippet, not full dump
- [x] Rule-based `suggestReply()` category templates (no API key)
- [ ] Full AI adapter / `askKnowledgeBase` / `findSimilarTickets` — Phase 4

#### Frontend
- [x] **3-column Ticket Workspace** (agent view)
  - Left: ticket info, customer, SLA countdown
  - Center: message thread (INTERNAL_NOTE hidden from customer on the API)
  - Right: status actions, related articles, Suggest Reply
- [x] Live SLA countdown (`useCountdown`)
- [x] Real-time messages via `messageAdded`
- [x] Real-time ticket updates via `ticketUpdated`
- [x] Agent queue: live `ticketCreated`
- [x] Supervisor: due-soon list from stored SLA dates (no `slaAlert` sub)
- [ ] Notification bell — later
- [x] Create Ticket: related public articles before submit (deflection)

#### Deliverable at push
```
✅ 3-column workspace renders, all panels functional
✅ Agent sends reply → customer sees it over graphql-ws (or refetch)
✅ Internal notes hidden from customer view
✅ Related KB articles appear beside the ticket
✅ Suggest Reply uses category templates, no API key required
✅ New ticket appears in agent queue in real time
✅ Unit tests for related ranking, templates, countdown
```

**Git push:** `git push origin phase/3-workspace-realtime` (local + GitHub only)

---

### PHASE 4 — Automation, Admin, Legal Ingest, Optional AI
**Branch:** `phase/4-automation-admin`
**Push when:** SLA escalation fires, admins can manage routing/KB, and local ingest can import approved sources.

#### Backend / Jobs
- [x] SLA cron job (`node-cron`, every 2 min): warning, breach, auto-close 48h after resolve
- [x] CSAT service: create survey on resolve, expire after 7d
- [ ] Webhook service — Phase 6
- [x] Admin resolvers: users, teams, routing rules, SLA policies
- [x] Knowledge admin: create/update/publish drafts (owned articles, no crawler)
- [x] `askKnowledgeBase(question)` rule-based citations (no LLM)
- [ ] Optional AI adapters openai/ollama — later
- [x] Low-confidence answers say they do not know

#### Local ingest tool (`tools/kb-ingest`)
- [ ] Deferred — not in this light slice

#### Frontend
- [x] Admin: Users
- [x] Admin: Teams
- [x] Admin: Routing Rules UI
- [x] Admin: SLA Policies UI
- [x] Admin: Knowledge drafts publish/unpublish
- [x] Customer: CSAT banner
- [x] Customer: Help Center Q&A box
- [ ] Agent workspace Q&A — use Help Center for now
- [x] Supervisor: CSAT counts on SLA watch

#### Deliverable at push
```
✅ Cron: SLA warning/breach notifications + auto-close after 48h resolved
✅ Admin can manage users, teams, routing, SLA hours, and KB drafts
✅ CSAT on resolve, 7-day window, supervisor sees counts
✅ Q&A returns cited owned articles or says it does not know
✅ Unit tests for SLA math, CSAT rules, Q&A confidence
```

**Git push:** `git push origin phase/4-automation-admin` (local + GitHub only; no crawler, no LLM)

---

### PHASE 5 — UI Customization (Appearance, Sounds, Ticket Views)
**Branch:** `phase/5-ui-customization`
**Push when:** Each signed-in user can personalize look, sound, type, and ticket density; prefs persist in MySQL; consultants can demo a branded workspace without a code change.

This phase is **UX product work**, not analytics. Old “Analytics & Polish” moves to **Phase 6**.

#### Product intent
Give customers, agents, and admins a **solid, convenient** workspace: they choose how the app looks and how tickets are scanned. Defaults stay premium (iris / current theme). Power users and consultants get a **Appearance** studio.

#### Scope — Appearance studio (`/settings`)
- [x] **Sounds:** on/off in Appearance; cues only on buttons, cancel, checkbox, radio, switch — never hover, typing, or every link
- [x] **Color mode:** system / light / dark — **per signed-in user** (`UiPreference.userId`). Login/public pages always use the product default (light + iris). Another user’s save never restyles the guest shell.
- [x] **Accent picker:** presets + custom hex + shade
- [x] **Surface finish:** matte / glossy / glass
- [x] **Type:** font family presets + size scale (S / M / L)
- [x] **Logo:** personal upload
- [x] **Density:** comfortable / compact
- [x] Persist `UiPreference` in MySQL, scoped to `userId`
- [x] GraphQL: `myAppearance`, `saveAppearance` — Zod + `requirePermission` + `audit()` on write
- [x] Apply tokens at runtime (CSS variables), no `any`

#### Scope — Ticket browsing UX
- [x] Sortable lists (updated, created, SLA due, priority)
- [x] Filterable (status, priority)
- [x] View modes: **list**, **compact row**, **large card**, **icon/grid**
- [x] Remember last view per user (same appearance row)

#### Out of scope (Phase 6+)
Analytics dashboards, security dashboard, webhooks, crawler, LLM, cloud host.

#### Architecture notes
- Resolvers call appearance service; Prisma only in services
- Tokens: `--background`, `--iris`, `--radius`, `--font-sans` already exist — extend, don’t fork a second design system
- Accessibility: contrast checks on custom hex; refuse unreadable combos
- Unit tests: token merge, contrast guard, view-mode enum, sound-target policy

#### Deliverable at push
```
✅ Appearance settings: sounds, light/dark, accent, finish, type, logo
✅ Prefs saved in DB and restored on login
✅ Ticket queues/lists: sort, filter, 4 view modes
✅ Defaults remain the current ZenFlow look
✅ Unit tests for appearance merge + ticket view enum
```

**Git push:** `git push origin phase/5-ui-customization` (local + GitHub only)

---

### PHASE 6 — Analytics, Security, UI fit, Consultant profiles & Polish
**Branch:** `phase/6-analytics-polish`
**Push when:** Phase 4 screens match the Appearance shell; one infographic dashboard; admin-only consultant profiles; spam/security review; fat local demo seed.

**Not in this phase:** AI/LLM (Phase 7), HTTP-only cookies, cloud host, crawler, webhooks.

#### Access — consultant profiles
Zendesk/Freshdesk put **agent performance + CSAT by assignee** in manager reporting, not on a wall agents browse. We copy that:

- Route: `/admin/consultants` (directory) and `/admin/consultants/[id]` (profile)
- Visible to **ADMIN** and **SUPER_ADMIN** only (`consultant:read`)
- Agents, customers, and supervisors **cannot** open another consultant’s profile
- Supervisor still sees **team KPIs** on the analytics dashboard (no drill-into-peer profile)
- `audit()` on every profile view

#### UX draft (admin)

**Directory `/admin/consultants`**
```
[PageTitle: Consultants]     [Search Field]  [Team Select]

KPI strip (org): active agents | tickets resolved 30d | avg CSAT

Table / cards (same ticket-view tokens):
  Avatar  Name  Team(s)  Open  Resolved 30d  CSAT  Last active     [View]
```

**Profile `/admin/consultants/[id]`** — not a social page
```
Header (surface): avatar | name | role | teams | last login
Primary buttons:  [Open tickets assigned]  [Back to directory]
                  No “rate this agent”. Ratings are customer CSAT only.

Summary KPIs (4–6 tiles):
  Open assigned | Resolved | Closed | Avg first response | Avg resolve | CSAT avg (n)

Charts (same dashboard kit — shadcn/Recharts + --chart-* tokens):
  Line: resolved per week
  Pie/donut: status mix
  Bar: CSAT 1–5 distribution
  Chart-type Select reuses the dashboard switcher

Completed work:
  List of resolved/closed tickets (ticketNumber, title, CSAT if any, date)
  Click → existing workspace (admin already allowed)

Empty: “No resolved tickets yet.” Skeleton on load.
```

Sounds: same global click policy; one optional chart-tap cue (shared with analytics). Density/finish/accent from Appearance. No hardcoded hex.

#### Slice 1 — UI accommodation
- Admin users/teams/routing/SLA/KB use Field, Select, PageTitle, surface
- Remove leftover unprefixed admin routes if they still collide
- CSAT banner + Help Q&A match the shell
- Agent workspace: Q&A on the right rail
- Supervisor watch uses ticket view prefs + CSAT KPI tiles

#### Slice 2 — Analytics dashboard
- One screen `/admin/analytics` (ADMIN+) and a **read-team** view for SUPERVISOR at `/supervisor` extra tab or `/analytics` with `analytics:read:team`
- Date range, team, category filters
- Chart-type switcher: line, area, bar, pie, donut, radial, radar — same data
- KPIs + grid of infographics (volume, SLA, CSAT, category, unanswered Help)
- Library: **shadcn Chart on Recharts** (already in package.json) + Framer Motion layout; CSS variables only

#### Slice 3 — Spam & security (MIT, don’t rewrite)
Keep `spamDetector` + `bad-words` + `isbot`. Behind it:
- [NaturalNode/natural](https://github.com/NaturalNode/natural) (MIT) for similarity / tokens
- Security screen `/admin/security`: audit log, blocked IPs, spam queue confirm/dismiss
- No cloud spam APIs

#### Slice 4 — Polish
- Seed 144 tickets, 6 consultants (Maya, Jordan, Priya, Marcus, Lina + supervisor), threads, CSAT comments, spam flags
- Skeletons, empty states
- Permission pass

#### Backend
- [x] Analytics service + resolvers (role-scoped)
- [x] `consultants` / `consultantProfile(id)` — ADMIN+ only
- [x] Profile stats from tickets assignedTo + CSAT on those tickets
- [x] Security resolvers as above
- [x] Dice similarity wired into existing score, same 0–100 verdicts
- [x] Demo seed

#### Frontend
- [x] Dashboard + chart switcher
- [x] Consultant directory + profile
- [x] Security page
- [x] UI fit for Phase 4 screens

#### Deliverable at push
```
✅ Phase 4 admin/CSAT/Q&A look like Appearance
✅ Infographic dashboard, filterable chart types
✅ Admin-only consultant profiles (progress, CSAT, completed tickets)
✅ Spam/security review, MIT libs, no peer profile browsing
✅ Local seed; no AI, no cloud, no cookie change
```

**Git push:** `git push origin phase/6-analytics-polish` → merge `main`

---

### PHASE 7 — AI consultant (grounded chain)
**Branch:** `phase/7-ai-consultant`

Nova (seeded `nova@zenflowai.com`, `isAiConsultant`) is first assignee. Consult is retrieve → optional tiny Ollama SLM → extractive KB → human handoff. `createTicket` does not wait on the model. `ollama` JS client is in backend `package.json`. Runtime/model is **not** downloaded by `pnpm install`. `pnpm --filter backend ai:doctor` always exits 0. `ai:setup` is opt-in (no signup).

- [x] `KnowledgeChunk` + `ConsultAttempt`
- [x] AI-first routing; human only if confidence is low or “Still need a person”
- [x] Unit tests for consult math, probe circuit, ingest skip

**Not in this phase:** paid LLM, Firecrawl keys, HTTP-only cookies, cloud, webhooks.

---

### Branch Strategy Summary

```
main                    ← always stable, always deployable
  └── phase/1-foundation
  └── phase/2-ticket-engine
  └── phase/3-workspace-realtime
  └── phase/4-automation-admin
  └── phase/5-ui-customization
  └── phase/6-analytics-polish
  └── phase/7-ai-consultant
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
| Phase 1 — Foundation & Auth | ✅ Implemented | `phase/1-foundation` | merged with Phase 2 |
| Phase 2 — Ticket Engine + KB Foundation | ✅ Merged | `phase/2-ticket-engine` | #1 merged |
| Phase 3 — Workspace, Real-Time, KB in Tickets | ✅ Implemented (light) | `phase/3-workspace-realtime` | GitHub only |
| Phase 4 — Automation, Legal Ingest, Optional AI | ✅ Implemented (light, no crawler/LLM) | `phase/4-automation-admin` | GitHub |
| Phase 5 — UI Customization | ✅ Merged to `main` (Appearance + per-user prefs) | `phase/5-ui-customization` | #3 isolation |
| Phase 6 — Analytics, UI fit, consultant profiles, security | ✅ Merged to `main` (unit tests; AI is Phase 7) | `phase/6-analytics-polish` | #2 |
| Phase 7 — AI consultant | ✅ Merged to `main` (CI tests + SonarQube config on `fix/ci-unit-tests-and-sonar`) | `phase/7-ai-consultant` | #5 |

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
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=10

# SLA Cron
SLA_CHECK_INTERVAL_CRON="*/2 * * * *"

# AI (optional local Ollama; default is retrieval)
AI_PROVIDER=auto          # auto | retrieval | ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=smollm2:360m

# SonarQube / SonarCloud (GitHub Actions secret; optional locally)
SONAR_TOKEN=
SONAR_HOST_URL=https://sonarcloud.io
KB_DATA_DIR=./data/kb     # gitignored

# Frontend
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_APP_NAME=ZenFlowAI
```

---

## 21. Knowledge Base, Legal Ingest, and AI

### Crawler choice: do not use both as the default

| Tool | License | Best for | Use in ZenFlowAI |
|------|---------|----------|------------------|
| **Crawl4AI** | Apache 2.0 | Local crawl → clean Markdown, `robots.txt` | **Default ingest fetcher** |
| **Firecrawl** | AGPL-3.0 self-host / hosted API | Production scrape API, JS pages, PDFs | Optional later adapter if we have a key |
| **Scrapling** | BSD-3-Clause | Adaptive selectors, spiders | Not default. Do **not** use StealthyFetcher |

Firecrawl is nicer as a hosted scrape API, but self-hosting AGPL-3.0 inside our app is a license risk. Scrapling is powerful, but its stealth / Cloudflare-bypass features are the wrong default for a legal KB pipeline.

Decision:

```text
FetcherAdapter
  ├── Crawl4AI  (default, local, robots.txt, rate-limited)
  └── Firecrawl (optional, approved sources only)
```

Never enable CAPTCHA solving, login bypass, paywall bypass, or stealth fingerprinting.

### What we scrape — and what we do not

**Useful:**

- Our own help docs and product pages
- Our own internal playbooks, written by us
- Official vendor docs we are allowed to reuse, with source URL and license note
- Public RFC / standard docs when license allows

**Not useful / not allowed:**

- Random internet dumps
- Other companies' full help centers copied wholesale
- Login-only, paywalled, or CAPTCHA-blocked pages
- Scraped customer tickets from other products
- Anything we cannot cite and remove later

A solid KB is mostly **owned content**. Scraping is a refresh pipeline, not the source of truth.

### Why this helps AI / local AI

AI is only useful here if it answers from **retrieved, permitted chunks**.

```text
Question or ticket
        ↓
Search MySQL FULLTEXT on published chunks
        ↓
Keep 3–8 chunks, role-filtered
        ↓
Rule-based extract  OR  local Ollama / optional OpenAI
        ↓
Answer + article citations + confidence
```

That is helpful because:

- Local Ollama can run with no paid key
- The model never sees the whole KB, so tokens stay small
- Answers can be audited and unpublished
- The product still works if AI is offline

Unstructured scraped HTML dumped into GitHub is **not** helpful for AI.

### Storage

```text
data/kb/                gitignored
MySQL KnowledgeArticle  published content
MySQL KnowledgeChunk    search/retrieval units
sourceUrl + contentHash + licenseNote
DRAFT → REVIEW → PUBLISHED
```

Never commit scraped corpora to the repo.

---

*Last updated: Phase 7 AI consultant chain on `phase/7-ai-consultant`. Retrieval always; Ollama optional; human last. No cloud, no HTTP-only cookie.*

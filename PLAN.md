# ZenFlowAI — architecture (as shipped)

Local demo only. Phases 1–9 are in this repo. No cloud, no email SaaS, no paid LLM.

## Product

IT/customer support: tickets `#ZEN-XXXX`, live workspace, SLA, CSAT, Help Center, Nova first-response, per-user Appearance, analytics, local attachments, in-app notices.

Roles (fixed): `CUSTOMER → AGENT → SUPERVISOR → ADMIN → SUPER_ADMIN`

## Stack rules

- Frontend: Next.js 15 (dev: Turbopack), strict TS, Tailwind, Apollo cache (Zustand = auth only)
- Backend: Express, Apollo GraphQL, Prisma, MySQL, node-cron
- Auth: access JWT 15m (`localStorage`) + refresh 7d hashed in MySQL, cookie `zenflow_refresh` (HttpOnly, Path=/, SameSite=Lax; Secure only if `NODE_ENV=production`)
- Real-time: graphql-ws (`messageAdded`, `ticketUpdated`, `ticketCreated`)
- Resolvers: auth + `requirePermission` + service. No Prisma in resolvers.
- Writes: Zod then DB; sensitive writes call `audit()`
- Tickets: `#ZEN-XXXX` (min 4 digits)

Security order: Helmet → rate limit → IP blocklist → bot detection → JWT (role from DB) → RBAC → data scope → validation → spam → audit.

## Layout

```
apps/frontend/src/{app,modules,components,lib,store}
apps/backend/src/{graphql,services,security,jobs,utils}  prisma/  kb/
```

One frontend module per area. No cross-module internal imports. Shared UI → `components/ui/`. Queries → `modules/*/queries/`.

## Shipped surfaces

| Path | Who |
|------|-----|
| `/login` `/register` | Public |
| `/tickets` `/tickets/new` `/tickets/[id]` `/help` | Customer+ |
| `/queue` | Agent+ |
| `/knowledge/internal` | Staff |
| `/supervisor` | Supervisor+ |
| `/admin/…` `/admin/consultants` `/admin/security` | Admin+ |
| `/settings` | Signed-in |
| `/analytics` | Supervisor+ |

Bell: `Notification` rows on create / assign / reply / SLA. Files: `UPLOAD_DIR` via `uploadTicketAttachment`.

Nova: assign on create → retrieve `apps/backend/kb/` → optional Ollama if healthy → else extractive. Handoff on low confidence or “Still need a person”.

## Tests & CI

`pnpm test` = `tsx --test` on Prisma-free units (routing, SLA, spam, RBAC, cookies, error mapping, upload paths, consult math, appearance, auth cache, consultant packs, list search, route skeletons).

Coverage: `pnpm --filter backend test:coverage` (c8: **100% lines** on Prisma-free backend modules + frontend `src/lib`). Branches ~89% / functions ~92% are tsx CJS helpers and env `??` arms. Frontend `app/` / `modules/` / `components/`, GraphQL, and `*.service.ts` stay out of LCOV — same as CI / Sonar. Live e2e covers those I/O trees.

Live: `pnpm test:e2e` — customer login → me → tickets → notices → Help Center pack + search; then admin login → SLA policies → consultants (90-day pack) → `me` again (auth cache). Skips if API is down.

GitHub Actions: `pnpm db:generate` + tests. Optional Sonar if `SONAR_TOKEN` is set. **No** `migrate deploy` in CI.

Local clone: `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed`.

Old `db push` databases: `prisma migrate resolve --applied 20260922150000_init` once.

## Env (names that exist)

| Name | Role |
|------|------|
| `DATABASE_URL` | MySQL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` / `JWT_ACCESS_EXPIRES` | Auth (`15m` typical) |
| `PORT` `NODE_ENV` `ALLOWED_ORIGINS` | API + CORS (`credentials: true`) |
| `UPLOAD_DIR` `MAX_FILE_SIZE_MB` | Local files |
| `AI_PROVIDER` `OLLAMA_BASE_URL` `OLLAMA_MODEL` | Optional local model |
| `NEXT_PUBLIC_GRAPHQL_URL` `NEXT_PUBLIC_GRAPHQL_WS_URL` | Frontend |

Copy `apps/backend/.env.example`. Demo users stay `*@zenflowai.com` / `password123`.

## Phases (history)

| Phase | On `main` |
|-------|-----------|
| 1 Auth, RBAC, 10 layers | yes |
| 2 Tickets, routing, KB | [#1](https://github.com/iamfaizalmunna/zenflowai/pull/1) |
| 3 Workspace, graphql-ws | yes |
| 4 SLA cron, CSAT, admin | yes |
| 5 Appearance, views | [#3](https://github.com/iamfaizalmunna/zenflowai/pull/3) |
| 6 Analytics, consultants | [#2](https://github.com/iamfaizalmunna/zenflowai/pull/2) |
| 7 Nova | [#5](https://github.com/iamfaizalmunna/zenflowai/pull/5) |
| CI / Sonar | [#6](https://github.com/iamfaizalmunna/zenflowai/pull/6) |
| 8 Cookie, migrations, attachments, notices | [#8](https://github.com/iamfaizalmunna/zenflowai/pull/8) |
| 9 UI polish, speed, QA report | this merge |

## Phase 9 (UI, speed, QA)

Shipped with this merge. Scope: bug fixes, lighter mobile, calmer desktop, faster admin tabs, QA that CI can run without MySQL.

- Mobile: solid chrome (less blur), stacked ticket workspace, no horizontal overflow
- Desktop: quieter surfaces, login/splash, sidebar
- Speed: Turbopack in `pnpm dev`, `loading.tsx` skeletons, 8s auth identity cache, 90-day consultant ticket packs, client `filterByQuery`
- KB: staff can **Save as help draft** from a ticket (Internal + unpublished). Admin publishes. Never auto-public.
- QA: 140 Prisma-free units (100% c8 lines on that pack); `pnpm test:e2e` hits live GraphQL when the API is up; HTML report at `/qa/v1/`

Not in this phase: new roles, email, hosting.

Known demo windows: auth cache 8s (bans/roles); consultant list KPIs are 90-day; Help Center search is the 40-article pack. Create-ticket related articles still use server search.

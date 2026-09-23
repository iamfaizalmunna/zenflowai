# Phase 1 — Auth and security

**Status:** complete on `main`.

## Why this phase exists

A support desk stores private messages. Before tickets exist, the product must know who is signed in and what that person may open. Roles are a ladder that never reverses. Security checks run in a fixed order so a later screen cannot skip the queue.

## What was delivered

- Access JWT lasts **15 minutes**. Refresh token lasts **7 days** in cookie `zenflow_refresh` (HttpOnly, SameSite=Lax).
- Role on the JWT is not trusted. The API reads the user row (identity cache **8 seconds** for the same token).
- Home screens: customer `/dashboard`, agent `/queue`, supervisor `/supervisor`, admin `/admin/users`.

## User journey

```mermaid
flowchart TD
  A[Open /login] --> B[Email + password]
  B --> C[Access JWT 15m]
  C --> D[Refresh cookie 7d]
  D --> E[Role from MySQL]
  E --> F{Role}
  F -->|CUSTOMER| G["/dashboard"]
  F -->|AGENT| H["/queue"]
  F -->|SUPERVISOR| I["/supervisor"]
  F -->|ADMIN or SUPER_ADMIN| J["/admin/users"]
```

## Request algorithm

```mermaid
flowchart TD
  R[HTTP request] --> L1[Helmet]
  L1 --> L2[Rate limit]
  L2 --> L3[IP blocklist]
  L3 --> L4[Bot check]
  L4 --> L5[JWT]
  L5 --> L6[RBAC]
  L6 --> L7[Data scope]
  L7 --> L8[Zod]
  L8 --> L9[Spam]
  L9 --> L10[Audit on writes]
```

## Use cases

- A customer reaches tickets, not `/admin/users`.
- After a ban, the next request fails once the 8-second cache expires.

## Code

`apps/backend/src/security/` · `apps/frontend/src/lib/constants.ts` · `apps/frontend/src/app/(auth)/login`

[All phases](README.md) · [HTML card](index.html#p1)

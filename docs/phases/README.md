# Phases 1–9

Nine completed slices. Each story starts with **who it is for**, **what you see**, and **how it works**, then the chart. Open a row on GitHub for the write-up. Open the gallery in a browser for the colour diagrams.

| | Phase | In one sentence | Story |
|:--:|:------|:----------------|:------|
| [![01](https://img.shields.io/badge/01-6366f1?style=flat-square)](01-auth.md) | Auth and security | Who is signed in, which role, which home screen — before any ticket exists. | [Read](01-auth.md) |
| [![02](https://img.shields.io/badge/02-0ea5e9?style=flat-square)](02-tickets.md) | Tickets and routing | Mint `#ZEN-XXXX`, pick a team, stamp SLA clocks, store owned Help Center markdown. | [Read](02-tickets.md) |
| [![03](https://img.shields.io/badge/03-8b5cf6?style=flat-square)](03-workspace.md) | Live workspace | Three-column desk; replies arrive over graphql-ws without refresh. | [Read](03-workspace.md) |
| [![04](https://img.shields.io/badge/04-f59e0b?style=flat-square)](04-sla-csat.md) | SLA, CSAT, admin | Clock job for warning / breach / auto-close; 7-day survey; admin screens. | [Read](04-sla-csat.md) |
| [![05](https://img.shields.io/badge/05-ec4899?style=flat-square)](05-appearance.md) | Appearance | Theme belongs to the signed-in user; login stays default light. | [Read](05-appearance.md) |
| [![06](https://img.shields.io/badge/06-14b8a6?style=flat-square)](06-analytics.md) | Analytics | Supervisor charts and admin consultants on 30 / 90 / 112 day packs. | [Read](06-analytics.md) |
| [![07](https://img.shields.io/badge/07-a855f7?style=flat-square)](07-nova.md) | Nova | First reply from owned KB; optional Ollama; handoff below 0.45; drafts unpublished. | [Read](07-nova.md) |
| [![08](https://img.shields.io/badge/08-64748b?style=flat-square)](08-hardening.md) | Hardening | HttpOnly refresh cookie, committed migrations, local files, in-app bell. | [Read](08-hardening.md) |
| [![09](https://img.shields.io/badge/09-10b981?style=flat-square)](09-ui-qa.md) | UI, speed, QA | Faster paint of the same screens; 140 tests; HTML reports. | [Read](09-ui-qa.md) |

**Browser gallery:** [index.html](index.html) · [http://localhost:3000/qa/phases](http://localhost:3000/qa/phases)

| Also | Open |
|------|------|
| Architecture | [PLAN.md](../../PLAN.md) |
| Test bars | [../test-results/v1/index.html](../test-results/v1/index.html) · [http://localhost:3000/qa/v1](http://localhost:3000/qa/v1) |
| Product README | [../../README.md](../../README.md) |

Not in this demo: email, cloud object storage, Firecrawl, paid OpenAI, webhooks, SSO, hosted MySQL in CI.

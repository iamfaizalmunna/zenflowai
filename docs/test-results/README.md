# Test results

Progress bars need a browser. GitHub Markdown only lists the files.

| Open | Where |
|------|--------|
| Live report | [http://localhost:3000/qa/v1/](http://localhost:3000/qa/v1/) |
| Repo file | [v1/index.html](v1/index.html) |
| CLI | `pnpm test:report` |
| Phase charts | [http://localhost:3000/qa/phases](http://localhost:3000/qa/phases) · [../phases](../phases/README.md) |

| Version | Date | Unit | Lines (c8) | E2E |
|---------|------|------|------------|-----|
| [v1](v1/index.html) | 2026-09-23 | 140/140 | 100% lines | ok (144 tickets, 40 KB, 4 SLA, 6 consultants) |

v1 layout: overview bars → phases 1–9 → journeys J01–J11 → live GraphQL → coverage → out of LCOV.

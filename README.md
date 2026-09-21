# ZenFlowAI — Ticketing System

> Full-stack ticketing system with Next.js · Express · GraphQL · MySQL · Prisma

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 18, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express.js, Apollo Server (GraphQL) |
| **Database** | MySQL + Prisma ORM |
| **Auth** | JWT (JSON Web Tokens) |
| **Monorepo** | pnpm workspaces + Turborepo |
| **GraphQL Superpowers** | APQ (Automatic Persisted Queries) + Node Bookmarks |

## Project Structure

```
ZenFlowAI/
├── apps/
│   ├── backend/          # Express + Apollo GraphQL API
│   │   ├── prisma/       # Schema & migrations
│   │   └── src/
│   │       ├── graphql/  # Schemas + Resolvers
│   │       ├── middleware/
│   │       └── utils/
│   └── frontend/         # Next.js app
│       └── src/
│           ├── app/      # App Router pages
│           ├── components/
│           ├── lib/      # Apollo client + utilities
│           └── store/    # Zustand state
└── packages/
    └── shared/           # Shared TypeScript types
```

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)
- MySQL running locally

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your MySQL connection string

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 3. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with demo data
pnpm db:seed
```

### 4. Run the development servers

```bash
pnpm dev
```

- **Frontend:** http://localhost:3000
- **Backend/GraphQL:** http://localhost:4000/graphql
- **Prisma Studio:** `pnpm db:studio` → http://localhost:5555

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@zenflowai.com | password123 |
| Agent | agent@zenflowai.com | password123 |
| Customer | customer@zenflowai.com | password123 |

## GraphQL Superpowers

### 1. Automatic Persisted Queries (APQ)
The frontend uses Apollo's APQ link to save bandwidth — instead of sending the full query string every request, it sends a SHA-256 hash. The server caches the query and serves it from the hash.

### 2. Save Queries
Go to **Superpowers** in the sidebar to save and manage your GraphQL queries. Each saved query gets a SHA-256 hash you can copy and use as an APQ.

### 3. Bookmark Nodes
Bookmark any entity (Ticket, User, Comment...) with a custom label and color for quick access. The `isBookmarked` field is available on Ticket queries.

## GraphQL API

```graphql
# Login
mutation {
  login(email: "admin@zenflowai.com", password: "password123") {
    token
    user { id name role }
  }
}

# Get tickets
query {
  tickets(filter: { status: OPEN }, page: 1, pageSize: 10) {
    tickets { id title status priority isBookmarked }
    total totalPages
  }
}

# Save a query with APQ hash
mutation {
  saveQuery(input: {
    name: "Open Tickets Query"
    query: "query { tickets { tickets { id title } } }"
  }) {
    hash
  }
}

# Bookmark a node
mutation {
  bookmarkNode(input: { nodeType: "Ticket", nodeId: 1, label: "Important Bug", color: "#ef4444" }) {
    id label
  }
}
```

## Pushing to GitHub

```bash
# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/zenflowai.git

# Push
git push -u origin main
```

## Roadmap

- [ ] Real-time updates via GraphQL Subscriptions (WebSocket)
- [ ] Email notifications
- [ ] File attachments (S3)
- [ ] SLA tracking
- [ ] Analytics dashboard
- [ ] Apollo Federation (split into microservices)
- [ ] AI-powered ticket classification

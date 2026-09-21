import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import http from 'http';

import { typeDefs } from './graphql/schemas';
import { resolvers } from './graphql/resolvers';
import { buildContext } from './middleware/auth';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  // ─── Apollo Server ─────────────────────────────────────────────────────────
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,

    plugins: [
      // Graceful shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Apollo Sandbox in development
      ApolloServerPluginLandingPageLocalDefault({
        footer: false,
        embed: true,
      }),
    ],

    // Persisted Queries config (APQ)
    // When clients send { extensions: { persistedQuery: { version: 1, sha256Hash: "..." } } }
    // Apollo Server will look up the hash. Pair with a PersistedQueryCache for production.
  });

  await server.start();

  // ─── Express Middleware ─────────────────────────────────────────────────────
  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
      credentials: true,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json());

  // Health check
  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // ─── GraphQL endpoint ───────────────────────────────────────────────────────
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => buildContext({ req }),
    })
  );

  // ─── Start ──────────────────────────────────────────────────────────────────
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`
  🚀 ZenFlowAI Backend ready!
  ─────────────────────────────────────────────
  GraphQL:  http://localhost:${PORT}/graphql
  Health:   http://localhost:${PORT}/health
  ─────────────────────────────────────────────
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

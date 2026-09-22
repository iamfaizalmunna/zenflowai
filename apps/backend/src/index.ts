import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import http from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from './graphql/schemas';
import { resolvers } from './graphql/resolvers';
import { publicGraphqlError } from './utils/publicGraphqlError';
import { buildContext, buildContextFromAuthHeader } from './middleware/auth';
import {
  helmetMiddleware,
  hppMiddleware,
  requestIdMiddleware,
  ipBlocklistMiddleware,
  botDetectionMiddleware,
  globalRateLimiter,
  graphqlRateLimiter,
  authRateLimiter,
  speedLimiter,
  graphqlSecurityMiddleware,
  JSON_BODY_LIMIT,
  GRAPHQL_BODY_LIMIT,
} from './security/httpSecurity';

import { startSlaCron } from './jobs/slaCron';

const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  // ─── Layer 1: Unique request ID (must be first) ────────────────────────────
  app.use(requestIdMiddleware);

  // ─── Layer 2: Security headers (Helmet) ───────────────────────────────────
  app.use(helmetMiddleware);

  // ─── Layer 3: CORS ────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return cb(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.includes('apollographql.com') ||
          !IS_PROD
        ) {
          return cb(null, true);
        }
        return cb(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Apollo-Require-Preflight'],
    })
  );

  // ─── Layer 4: HTTP Parameter Pollution ────────────────────────────────────
  app.use(hppMiddleware);

  // ─── Layer 5: Logging ─────────────────────────────────────────────────────
  app.use(morgan(IS_PROD ? 'combined' : 'dev'));

  // ─── Layer 6: Body Parsing (with size limits) ──────────────────────────────
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

  // ─── Layer 7: Global Rate Limiting ────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── Layer 8: Progressive Slow-Down ───────────────────────────────────────
  app.use(speedLimiter);

  // ─── Layer 9: IP Blocklist ─────────────────────────────────────────────────
  app.use(ipBlocklistMiddleware);

  // ─── Layer 10: Bot Detection ──────────────────────────────────────────────
  app.use(botDetectionMiddleware);

  // ─── Apollo Server ─────────────────────────────────────────────────────────
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const params = (ctx.connectionParams ?? {}) as Record<string, string | undefined>;
        const authorization = params.authorization ?? params.Authorization ?? '';
        return buildContextFromAuthHeader(authorization, {
          ip: null,
          userAgent: null,
          requestId: null,
        });
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    introspection: !IS_PROD,

    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      ApolloServerPluginLandingPageLocalDefault({
        footer: false,
        embed: !IS_PROD,
      }),
    ],

    // Apollo error formatting — never leak stack traces in production
    formatError: (formattedError) => publicGraphqlError(formattedError),
  });

  await server.start();

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
  );

  // ─── GraphQL endpoint (with auth rate limiter + GraphQL-specific guards) ───
  app.use(
    '/graphql',
    express.json({ limit: GRAPHQL_BODY_LIMIT }),
    graphqlRateLimiter,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const body = req.body as { operationName?: string; query?: string } | undefined;
      if (
        body?.operationName === 'Login' ||
        body?.operationName === 'Register' ||
        body?.query?.includes('login(') ||
        body?.query?.includes('register(')
      ) {
        return authRateLimiter(req, res, next);
      }
      next();
    },
    graphqlSecurityMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => buildContext({ req }),
    })
  );

  // ─── 404 Handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({
      error: IS_PROD ? 'Internal server error' : err.message,
    });
  });

  // ─── Start ──────────────────────────────────────────────────────────────────
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  startSlaCron();

  console.log(`
  🚀 ZenFlowAI Backend ready!
  ─────────────────────────────────────────────────
  GraphQL:   http://localhost:${PORT}/graphql
  WS:        ws://localhost:${PORT}/graphql
  Health:    http://localhost:${PORT}/health
  ─────────────────────────────────────────────────
  🛡️  Security layers active:
      ✅ Helmet (security headers)
      ✅ HPP (parameter pollution protection)
      ✅ CORS (allowlist-based)
      ✅ Global rate limit (200 req/15min/IP)
      ✅ Auth rate limit (10 attempts/15min/IP)
      ✅ Slow-down (progressive delay)
      ✅ IP blocklist (DB-backed)
      ✅ Bot detection (UA fingerprinting)
      ✅ GraphQL depth limit (max 7)
      ✅ Introspection: ${IS_PROD ? 'DISABLED (prod)' : 'enabled (dev)'}
      ✅ RBAC (6-tier role hierarchy)
      ✅ Spam/scam AI detection
      ✅ Fair usage quotas + random cooldowns
      ✅ Audit logging
  ─────────────────────────────────────────────────
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

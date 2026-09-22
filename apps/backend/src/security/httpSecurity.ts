/**
 * ZenFlowAI — Enterprise HTTP Security Middleware Stack
 *
 * Layers (in order applied):
 *  1. Helmet       — security headers (CSP, HSTS, X-Frame-Options, etc.)
 *  2. HPP          — HTTP parameter pollution prevention
 *  3. IP Blocklist — check against DB blocklist on every request
 *  4. Bot Guard    — block known bot UAs from non-API paths
 *  5. Rate Limiter — per-IP rolling window (MIT: express-rate-limit)
 *  6. Slow Down    — progressive slowdown before hard limit
 *  7. Body Limits  — prevent oversized payloads
 *  8. Request ID   — unique ID on every request for tracing
 *  9. Auth Brute Force — track failed logins, lock after threshold
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { detectBotRequest, isIpBlocked } from './spamDetector';
import { auditSecurity } from './audit';

// ─── 1. Helmet (Security Headers) ────────────────────────────────────────────

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://embeddable-sandbox.cdn.apollographql.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://studio.apollographql.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,    // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});

// ─── 2. HPP (HTTP Parameter Pollution) ───────────────────────────────────────

export const hppMiddleware = hpp({
  whitelist: ['tags', 'status', 'priority'], // Allow arrays for these
});

// ─── 3. Request ID ────────────────────────────────────────────────────────────

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// ─── 4. IP Blocklist Check ────────────────────────────────────────────────────

export async function ipBlocklistMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const { blocked, reason } = await isIpBlocked(ip);

  if (blocked) {
    await auditSecurity('IP_BLOCKED_REQUEST', {
      actorIp: ip,
      actorAgent: req.headers['user-agent'],
      message: `Blocked request from banned IP: ${ip}. Reason: ${reason}`,
      severity: 'WARN',
    });

    return res.status(403).json({
      error: 'Access denied',
      code: 'IP_BLOCKED',
    });
  }

  next();
}

// ─── 5. Bot Detection Middleware ──────────────────────────────────────────────

export function botDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers['user-agent'] ?? '';
  const ip = getClientIp(req);

  // Allow Apollo Studio to pass through
  if (req.path === '/graphql' && req.headers.origin?.includes('apollographql')) {
    return next();
  }

  const { isBot, confidence, reason } = detectBotRequest(ua, ip);

  if (isBot && confidence > 0.8) {
    auditSecurity('BOT_DETECTED', {
      actorIp: ip,
      actorAgent: ua,
      message: `Bot request blocked: ${reason} (confidence: ${confidence})`,
      severity: 'WARN',
      metadata: { reason, confidence },
    });

    // Return 429 instead of 403 to slow down automated scrapers
    return res.status(429).json({
      error: 'Too many requests',
      code: 'BOT_DETECTED',
    });
  }

  next();
}

// ─── 6. Global Rate Limiter ───────────────────────────────────────────────────
// Hard limit: 200 req/15min per IP (all endpoints)

export const graphqlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many GraphQL requests from this IP. Please try again shortly.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req) => {
    return req.path === '/health' || req.path === '/graphql';
  },
  handler: async (req, res, next, options) => {
    const ip = getClientIp(req);
    await auditSecurity('RATE_LIMIT_HIT', {
      actorIp: ip,
      actorAgent: req.headers['user-agent'],
      message: `Global rate limit exceeded from ${ip}`,
      severity: 'WARN',
    });
    // Log violation to DB
    prisma.rateLimitViolation.create({
      data: {
        ip,
        endpoint: req.path,
        violationType: 'RATE_LIMIT',
        requestCount: options.limit,
        windowStart: new Date(),
      },
    }).catch(() => {});
    res.status(options.statusCode).json(options.message);
  },
});

// ─── 7. Auth Endpoint Rate Limiter ───────────────────────────────────────────
// Much stricter: 10 attempts/15min per IP on login/register

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT',
  },
  handler: async (req, res, next, options) => {
    const ip = getClientIp(req);
    await auditSecurity('AUTH_RATE_LIMIT_HIT', {
      actorIp: ip,
      actorAgent: req.headers['user-agent'],
      message: `Auth rate limit exceeded from ${ip}`,
      severity: 'ERROR',
    });
    res.status(options.statusCode).json(options.message);
  },
});

// ─── 8. Slow-Down Middleware ──────────────────────────────────────────────────
// Start adding 500ms delay after 50 requests, max 5s delay at 150

export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => (hits - 50) * 100,  // 100ms per extra hit
  maxDelayMs: 5000,
  skip: (req) => req.path === '/health' || req.path === '/graphql',
});

// ─── 9. Payload Size Limiter (applied in index.ts via express.json limit) ─────
export const JSON_BODY_LIMIT = '100kb';    // Prevent huge request bodies
export const GRAPHQL_BODY_LIMIT = '500kb'; // GraphQL queries can be larger

// ─── 10. GraphQL-specific security middleware ─────────────────────────────────

export function graphqlSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' && req.body) {
    const { query } = req.body;

    if (typeof query === 'string') {
      // ── Depth limit: prevent deeply nested queries (DoS) ──────────────────
      const depth = measureQueryDepth(query);
      if (depth > 7) {
        return res.status(400).json({
          errors: [{ message: 'Query exceeds maximum depth of 7', extensions: { code: 'QUERY_TOO_DEEP' } }],
        });
      }

      // ── Complexity: block excessively long query strings ──────────────────
      if (query.length > 10000) {
        return res.status(400).json({
          errors: [{ message: 'Query string too long', extensions: { code: 'QUERY_TOO_LONG' } }],
        });
      }

      // ── Block introspection in production ─────────────────────────────────
      if (process.env.NODE_ENV === 'production' && query.includes('__schema')) {
        return res.status(403).json({
          errors: [{ message: 'Introspection is disabled in production', extensions: { code: 'INTROSPECTION_DISABLED' } }],
        });
      }
    }
  }
  next();
}

// ─── Brute-Force Login Protection ────────────────────────────────────────────

export async function recordFailedLogin(userId: number, ip: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginCount: true, role: true },
  });
  if (!user) return;

  const maxAttempts = 5;
  const lockDurationMs = 15 * 60 * 1000;

  const newCount = user.failedLoginCount + 1;

  if (newCount >= maxAttempts) {
    const lockedUntil = new Date(Date.now() + lockDurationMs);
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: newCount, lockedUntil },
    });
    await auditSecurity('ACCOUNT_LOCKED', {
      actorId: userId,
      actorIp: ip,
      message: `Account #${userId} locked after ${newCount} failed login attempts`,
      severity: 'ERROR',
      metadata: { failedAttempts: newCount, lockedUntil },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: newCount },
    });
  }
}

export async function recordSuccessfulLogin(userId: number, ip: string, _userAgent?: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    },
  });
}

export async function checkAccountLock(userId: number): Promise<{ locked: boolean; until?: Date }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, isBanned: true, isActive: true },
  });
  if (!user) return { locked: false };
  if (!user.isActive || user.isBanned) return { locked: true };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { locked: true, until: user.lockedUntil };
  }
  return { locked: false };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function measureQueryDepth(query: string): number {
  let maxDepth = 0;
  let depth = 0;
  for (const char of query) {
    if (char === '{') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === '}') {
      depth--;
    }
  }
  return maxDepth;
}

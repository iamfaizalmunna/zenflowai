/**
 * ZenFlowAI — Auth Service
 *
 * Handles: login, register, token refresh, logout, session management.
 * Pure business logic — no GraphQL, no Express concerns here.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { auditAuth } from '../security/audit';
import { recordFailedLogin, recordSuccessfulLogin, checkAccountLock } from '../security/httpSecurity';

const ACCESS_SECRET  = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES  ?? '15m';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
  ip: string,
  userAgent?: string | null
): Promise<{ tokens: TokenPair; user: AuthUser }> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt comparison to prevent timing attacks
  const fakeHash = '$2b$10$invalidhashtopreventtimingattacks000000000000000000000';
  const validHash = user?.password ?? fakeHash;
  const passwordMatch = await bcrypt.compare(password, validHash);

  if (!user || !passwordMatch) {
    if (user) await recordFailedLogin(user.id, ip);
    await auditAuth('LOGIN_FAILED', {
      actorIp: ip,
      actorAgent: userAgent,
      message: `Failed login attempt for ${email}`,
      severity: 'WARN',
    });
    throw new GraphQLError('Invalid email or password', {
      extensions: { code: 'UNAUTHORIZED' },
    });
  }

  // Check account lock / ban / inactive
  const lockStatus = await checkAccountLock(user.id);
  if (lockStatus.locked) {
    const msg = lockStatus.until
      ? `Account locked until ${lockStatus.until.toISOString()}`
      : 'Account is disabled';
    throw new GraphQLError(msg, { extensions: { code: 'ACCOUNT_LOCKED' } });
  }

  if (!user.isActive || user.isBanned) {
    throw new GraphQLError('Account is suspended. Please contact support.', {
      extensions: { code: 'ACCOUNT_SUSPENDED' },
    });
  }

  const tokens = await createTokenPair(user.id, user.role, ip, userAgent);
  await recordSuccessfulLogin(user.id, ip, userAgent ?? undefined);

  await auditAuth('LOGIN_SUCCESS', {
    actorId: user.id,
    actorIp: ip,
    actorAgent: userAgent,
    message: `User ${email} logged in`,
    severity: 'INFO',
  });

  return {
    tokens,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  name: string,
  password: string,
  ip: string,
  userAgent?: string | null
): Promise<{ tokens: TokenPair; user: AuthUser }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new GraphQLError('An account with this email already exists', {
      extensions: { code: 'EMAIL_TAKEN' },
    });
  }

  if (password.length < 8) {
    throw new GraphQLError('Password must be at least 8 characters', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashed,
      role: 'CUSTOMER', // new users are always CUSTOMER
      registeredIp: ip,
    },
  });

  const tokens = await createTokenPair(user.id, user.role, ip, userAgent);

  await auditAuth('REGISTER_SUCCESS', {
    actorId: user.id,
    actorIp: ip,
    actorAgent: userAgent,
    message: `New user registered: ${email}`,
    severity: 'INFO',
  });

  return {
    tokens,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string,
  ip: string
): Promise<{ accessToken: string; user: AuthUser }> {
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    throw new GraphQLError('Invalid or expired refresh token', {
      extensions: { code: 'UNAUTHORIZED' },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive || user.isBanned) {
    throw new GraphQLError('Account is disabled', { extensions: { code: 'UNAUTHORIZED' } });
  }

  // Issue new access token
  const accessToken = signAccessToken(user.id, user.role);

  // Rotate session last-seen
  await prisma.userSession.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { lastSeenAt: new Date() },
  });

  return {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutUser(userId: number, refreshToken?: string): Promise<void> {
  // Revoke refresh token if provided
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId },
      data: { isRevoked: true },
    });
  }

  // Revoke all sessions for this user on this device (could also revoke all sessions)
  await prisma.userSession.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT' },
  });

  await auditAuth('LOGOUT', {
    actorId: userId,
    message: `User #${userId} logged out`,
    severity: 'INFO',
  });
}

// ── Get current user ──────────────────────────────────────────────────────────

export async function getMe(userId: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTokenPair(
  userId: number,
  role: string,
  ip: string,
  userAgent?: string | null
): Promise<TokenPair> {
  const accessToken  = signAccessToken(userId, role);
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash    = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

  // Store refresh token hash
  await prisma.refreshToken.create({
    data: { userId, tokenHash, ip, userAgent, expiresAt },
  });

  // Store session record
  const accessHash = hashToken(accessToken);
  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: accessHash,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  });

  return { accessToken, refreshToken };
}

function signAccessToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES as any });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

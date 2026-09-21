/**
 * ZenFlowAI - Enterprise RBAC (Role-Based Access Control)
 *
 * Role Hierarchy:  SUPER_ADMIN > ADMIN > MODERATOR > AGENT > CUSTOMER > GUEST
 *
 * Permission format: "resource:action"
 * e.g. "ticket:create", "user:ban", "admin:manage"
 */

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MODERATOR: 60,
  AGENT: 40,
  CUSTOMER: 20,
  GUEST: 0,
};

// Returns true if actorRole has equal or higher privilege than targetRole
export function hasHigherOrEqualRole(actorRole: string, targetRole: string): boolean {
  return (ROLE_HIERARCHY[actorRole] ?? 0) >= (ROLE_HIERARCHY[targetRole] ?? 0);
}

// ─── Permission Map ───────────────────────────────────────────────────────────
// Each role gets an explicit set of permissions. Higher roles inherit lower ones.

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  GUEST: new Set([
    'ticket:read:public',
  ]),

  CUSTOMER: new Set([
    // Tickets
    'ticket:create',
    'ticket:read:own',
    'ticket:update:own',
    // Comments
    'comment:create',
    'comment:read',
    'comment:delete:own',
    // Profile
    'user:read:own',
    'user:update:own',
    // Notifications
    'notification:read:own',
    'notification:update:own',
    // Superpowers
    'query:save',
    'query:read:own',
    'query:delete:own',
    'node:bookmark',
    'node:bookmark:read:own',
  ]),

  AGENT: new Set([
    // All CUSTOMER permissions
    'ticket:create',
    'ticket:read:own',
    'ticket:read:assigned',
    'ticket:read:all',
    'ticket:update:own',
    'ticket:update:assigned',
    'ticket:assign',
    'ticket:resolve',
    'ticket:close',
    // Comments
    'comment:create',
    'comment:read',
    'comment:delete:own',
    'comment:delete:assigned-ticket',
    'comment:internal:create',   // internal notes
    // Categories & tags (read only)
    'category:read',
    'tag:read',
    // Users (limited)
    'user:read:own',
    'user:read:limited',
    'user:update:own',
    // Notifications
    'notification:read:own',
    'notification:update:own',
    // Superpowers
    'query:save',
    'query:read:own',
    'query:delete:own',
    'node:bookmark',
    'node:bookmark:read:own',
  ]),

  MODERATOR: new Set([
    // All AGENT permissions +
    'ticket:create',
    'ticket:read:all',
    'ticket:update:any',
    'ticket:delete:spam',
    'ticket:flag',
    'ticket:resolve',
    'ticket:close',
    'ticket:assign',
    // Comments
    'comment:create',
    'comment:read',
    'comment:delete:any',
    'comment:flag',
    'comment:internal:create',
    // Users
    'user:read:all',
    'user:read:own',
    'user:update:own',
    'user:flag',
    'user:suspend',           // temporary suspension
    'user:warn',
    // Spam management
    'spam:report',
    'spam:review',
    'spam:confirm',
    'spam:dismiss',
    // Categories & tags
    'category:read',
    'category:create',
    'tag:read',
    'tag:create',
    // Audit logs
    'audit:read:limited',
    // Notifications
    'notification:read:own',
    'notification:update:own',
    // Superpowers
    'query:save',
    'query:read:own',
    'query:delete:own',
    'node:bookmark',
    'node:bookmark:read:own',
  ]),

  ADMIN: new Set([
    // Full ticket control
    'ticket:create',
    'ticket:read:all',
    'ticket:update:any',
    'ticket:delete:any',
    'ticket:assign',
    'ticket:resolve',
    'ticket:close',
    'ticket:flag',
    // Full comment control
    'comment:create',
    'comment:read',
    'comment:delete:any',
    'comment:flag',
    'comment:internal:create',
    // User management (except SUPER_ADMIN)
    'user:read:all',
    'user:read:own',
    'user:update:any',
    'user:ban',
    'user:unban',
    'user:suspend',
    'user:warn',
    'user:flag',
    'user:role:set:agent',
    'user:role:set:moderator',
    'user:role:set:customer',
    // Categories & tags (full)
    'category:create',
    'category:read',
    'category:update',
    'category:delete',
    'tag:create',
    'tag:read',
    'tag:update',
    'tag:delete',
    // Teams
    'team:create',
    'team:read',
    'team:update',
    'team:delete',
    // Spam
    'spam:report',
    'spam:review',
    'spam:confirm',
    'spam:dismiss',
    'spam:autoflag',
    // IP management
    'ip:block',
    'ip:unblock',
    'ip:read',
    // Audit logs
    'audit:read:all',
    // Quotas
    'quota:read',
    'quota:update',
    // Superpowers
    'query:save',
    'query:read:any',
    'query:delete:any',
    'node:bookmark',
    'node:bookmark:read:any',
    // Notifications
    'notification:read:own',
    'notification:update:own',
    'notification:send',
    // Permission overrides
    'permission:override:grant',
    'permission:override:revoke',
    // Sessions
    'session:revoke:any',
  ]),

  SUPER_ADMIN: new Set([
    '*', // wildcard — all permissions
  ]),
};

// ─── Permission Checker ───────────────────────────────────────────────────────

export function hasPermission(
  role: string,
  permission: string,
  overrides?: Array<{ permission: string; granted: boolean }>
): boolean {
  // Check explicit overrides first
  if (overrides) {
    const override = overrides.find((o) => o.permission === permission);
    if (override !== undefined) return override.granted;
  }

  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  // SUPER_ADMIN wildcard
  if (rolePerms.has('*')) return true;

  return rolePerms.has(permission);
}

// Guard factory — throws GraphQLError if permission not met
import { GraphQLError } from 'graphql';

export function requirePermission(
  role: string | null,
  permission: string,
  overrides?: Array<{ permission: string; granted: boolean }>
): void {
  if (!role) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (!hasPermission(role, permission, overrides)) {
    throw new GraphQLError(
      `Insufficient permissions: requires "${permission}"`,
      {
        extensions: {
          code: 'FORBIDDEN',
          requiredPermission: permission,
          yourRole: role,
        },
      }
    );
  }
}

// ─── Role Limits for Fair Usage ───────────────────────────────────────────────
// Cooldown ranges in ms [min, max] — actual cooldown is random within range

export interface RoleLimits {
  // Tickets per hour / per day
  ticketsPerHour: number;
  ticketsPerDay: number;
  // Comments per hour / per day
  commentsPerHour: number;
  commentsPerDay: number;
  // API calls per minute
  apiCallsPerMinute: number;
  // Cooldown between ticket creations (ms) [min, max] — randomised
  ticketCooldownMs: [number, number];
  // Cooldown between comments (ms) [min, max]
  commentCooldownMs: [number, number];
  // Max sessions simultaneously
  maxSessions: number;
  // Max failed login attempts before lockout
  maxFailedLogins: number;
  // Lockout duration (ms)
  lockoutDurationMs: number;
}

export const ROLE_LIMITS: Record<string, RoleLimits> = {
  GUEST: {
    ticketsPerHour: 0,
    ticketsPerDay: 0,
    commentsPerHour: 0,
    commentsPerDay: 0,
    apiCallsPerMinute: 10,
    ticketCooldownMs: [0, 0],
    commentCooldownMs: [0, 0],
    maxSessions: 1,
    maxFailedLogins: 3,
    lockoutDurationMs: 30 * 60 * 1000, // 30 min
  },

  CUSTOMER: {
    ticketsPerHour: 3,
    ticketsPerDay: 10,
    commentsPerHour: 20,
    commentsPerDay: 100,
    apiCallsPerMinute: 30,
    ticketCooldownMs: [30_000, 120_000],   // 30s–2min random
    commentCooldownMs: [5_000, 30_000],    // 5s–30s random
    maxSessions: 3,
    maxFailedLogins: 5,
    lockoutDurationMs: 15 * 60 * 1000,    // 15 min
  },

  AGENT: {
    ticketsPerHour: 20,
    ticketsPerDay: 100,
    commentsPerHour: 60,
    commentsPerDay: 500,
    apiCallsPerMinute: 100,
    ticketCooldownMs: [5_000, 15_000],    // 5s–15s
    commentCooldownMs: [1_000, 5_000],    // 1s–5s
    maxSessions: 5,
    maxFailedLogins: 10,
    lockoutDurationMs: 10 * 60 * 1000,
  },

  MODERATOR: {
    ticketsPerHour: 50,
    ticketsPerDay: 300,
    commentsPerHour: 100,
    commentsPerDay: 1000,
    apiCallsPerMinute: 200,
    ticketCooldownMs: [2_000, 8_000],
    commentCooldownMs: [500, 2_000],
    maxSessions: 5,
    maxFailedLogins: 10,
    lockoutDurationMs: 5 * 60 * 1000,
  },

  ADMIN: {
    ticketsPerHour: 200,
    ticketsPerDay: 2000,
    commentsPerHour: 500,
    commentsPerDay: 5000,
    apiCallsPerMinute: 500,
    ticketCooldownMs: [0, 2_000],
    commentCooldownMs: [0, 500],
    maxSessions: 10,
    maxFailedLogins: 15,
    lockoutDurationMs: 2 * 60 * 1000,
  },

  SUPER_ADMIN: {
    ticketsPerHour: Infinity,
    ticketsPerDay: Infinity,
    commentsPerHour: Infinity,
    commentsPerDay: Infinity,
    apiCallsPerMinute: Infinity,
    ticketCooldownMs: [0, 0],
    commentCooldownMs: [0, 0],
    maxSessions: 20,
    maxFailedLogins: 20,
    lockoutDurationMs: 0,
  },
};

// ─── Random Cooldown Generator ────────────────────────────────────────────────
// Returns a randomised cooldown ms within the role's range
// Randomising makes it harder for bots to time their requests

export function getRandomCooldownMs(role: string, action: 'ticket' | 'comment'): number {
  const limits = ROLE_LIMITS[role] ?? ROLE_LIMITS.CUSTOMER;
  const [min, max] = action === 'ticket' ? limits.ticketCooldownMs : limits.commentCooldownMs;
  if (min === 0 && max === 0) return 0;
  // Add additional jitter: ±20% of range
  const base = min + Math.random() * (max - min);
  const jitter = base * 0.2 * (Math.random() - 0.5) * 2;
  return Math.max(0, Math.round(base + jitter));
}

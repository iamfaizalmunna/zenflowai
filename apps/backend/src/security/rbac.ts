/**
 * ZenFlowAI — RBAC (Role-Based Access Control)
 *
 * Role Hierarchy: CUSTOMER < AGENT < SUPERVISOR < ADMIN < SUPER_ADMIN
 *
 * Permission format: "resource:action" or "resource:action:scope"
 * e.g. "ticket:create", "user:ban", "ticket:read:own"
 *
 * Design principles:
 * - Each role has an explicit permission set (no implicit inheritance)
 * - SUPER_ADMIN has wildcard "*" — matches everything
 * - requirePermission() throws GraphQLError — call it at resolver entry points only
 * - PermissionOverride table allows per-user grants/revocations beyond role baseline
 */

import { GraphQLError } from 'graphql';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  CUSTOMER:    0,
  AGENT:       1,
  SUPERVISOR:  2,
  ADMIN:       3,
  SUPER_ADMIN: 4,
};

export function hasHigherOrEqualRole(actorRole: string, targetRole: string): boolean {
  return (ROLE_HIERARCHY[actorRole] ?? -1) >= (ROLE_HIERARCHY[targetRole] ?? 0);
}

// ─── Permission Sets ──────────────────────────────────────────────────────────

const CUSTOMER_PERMS = new Set([
  'ticket:create',
  'ticket:read:own',
  'ticket:update:own',
  'message:create',
  'message:read',
  'message:delete:own',
  'user:read:own',
  'user:update:own',
  'notification:read:own',
  'notification:update:own',
  'query:save',
  'query:read:own',
  'query:delete:own',
  'node:bookmark',
  'node:bookmark:read:own',
  'csat:submit',
  'appearance:read:own',
  'appearance:update:own',
]);

const AGENT_PERMS = new Set([
  ...CUSTOMER_PERMS,
  'ticket:read:all',
  'ticket:read:assigned',
  'ticket:update:assigned',
  'ticket:assign:own-team',
  'ticket:resolve',
  'ticket:close',
  'message:internal:create',
  'user:read:limited',
  'category:read',
  'tag:read',
  'team:read',
  'knowledge:read:internal',
]);

const SUPERVISOR_PERMS = new Set([
  ...AGENT_PERMS,
  'ticket:read:all',
  'ticket:update:any',
  'ticket:delete:spam',
  'ticket:flag',
  'ticket:assign',
  'message:delete:any',
  'message:flag',
  'user:read:all',
  'user:flag',
  'user:suspend',
  'user:warn',
  'spam:report',
  'spam:review',
  'spam:confirm',
  'spam:dismiss',
  'category:create',
  'category:update',
  'tag:create',
  'tag:update',
  'routing:read',
  'sla:read',
  'audit:read:limited',
  'knowledge:create',
  'knowledge:update',
  'analytics:read:team',
]);

const ADMIN_PERMS = new Set([
  ...SUPERVISOR_PERMS,
  'ticket:delete:any',
  'user:read:all',
  'user:update:any',
  'user:ban',
  'user:unban',
  'user:role:set:agent',
  'user:role:set:supervisor',
  'user:role:set:customer',
  'category:delete',
  'tag:delete',
  'team:create',
  'team:update',
  'team:delete',
  'routing:create',
  'routing:update',
  'routing:delete',
  'sla:update',
  'ip:block',
  'ip:unblock',
  'ip:read',
  'audit:read:all',
  'quota:read',
  'quota:update',
  'permission:override:grant',
  'permission:override:revoke',
  'session:revoke:any',
  'webhook:manage',
  'knowledge:delete',
  'analytics:read:all',
  'notification:send',
]);

export const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  CUSTOMER:    CUSTOMER_PERMS,
  AGENT:       AGENT_PERMS,
  SUPERVISOR:  SUPERVISOR_PERMS,
  ADMIN:       ADMIN_PERMS,
  SUPER_ADMIN: new Set(['*']),
};

// ─── Permission Checker ───────────────────────────────────────────────────────

export function hasPermission(
  role: string,
  permission: string,
  overrides?: Array<{ permission: string; granted: boolean }>
): boolean {
  // Check explicit overrides first (per-user grants/revocations)
  if (overrides?.length) {
    const override = overrides.find((o) => o.permission === permission);
    if (override !== undefined) return override.granted;
  }

  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.has('*')) return true;   // SUPER_ADMIN wildcard
  return perms.has(permission);
}

// Guard — throws if permission not met. Call at resolver entry.
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
    throw new GraphQLError(`Insufficient permissions. Required: "${permission}"`, {
      extensions: {
        code: 'FORBIDDEN',
        requiredPermission: permission,
        yourRole: role,
      },
    });
  }
}

// ─── Role Limits (fair usage per role) ────────────────────────────────────────

export interface RoleLimits {
  ticketsPerHour:    number;
  ticketsPerDay:     number;
  messagesPerHour:   number;
  messagesPerDay:    number;
  apiCallsPerMinute: number;
  ticketCooldownMs:  [number, number]; // [min, max] randomised range
  messageCooldownMs: [number, number];
  maxSessions:       number;
  maxFailedLogins:   number;
  lockoutDurationMs: number;
}

export const ROLE_LIMITS: Record<string, RoleLimits> = {
  CUSTOMER: {
    ticketsPerHour: 3,  ticketsPerDay: 10,
    messagesPerHour: 20, messagesPerDay: 100,
    apiCallsPerMinute: 30,
    ticketCooldownMs: [30_000, 120_000],
    messageCooldownMs: [5_000, 30_000],
    maxSessions: 3, maxFailedLogins: 5,
    lockoutDurationMs: 15 * 60 * 1000,
  },
  AGENT: {
    ticketsPerHour: 20, ticketsPerDay: 100,
    messagesPerHour: 60, messagesPerDay: 500,
    apiCallsPerMinute: 100,
    ticketCooldownMs: [5_000, 15_000],
    messageCooldownMs: [1_000, 5_000],
    maxSessions: 5, maxFailedLogins: 10,
    lockoutDurationMs: 10 * 60 * 1000,
  },
  SUPERVISOR: {
    ticketsPerHour: 50, ticketsPerDay: 300,
    messagesPerHour: 100, messagesPerDay: 1000,
    apiCallsPerMinute: 200,
    ticketCooldownMs: [2_000, 8_000],
    messageCooldownMs: [500, 2_000],
    maxSessions: 5, maxFailedLogins: 10,
    lockoutDurationMs: 5 * 60 * 1000,
  },
  ADMIN: {
    ticketsPerHour: 200, ticketsPerDay: 2000,
    messagesPerHour: 500, messagesPerDay: 5000,
    apiCallsPerMinute: 500,
    ticketCooldownMs: [0, 2_000],
    messageCooldownMs: [0, 500],
    maxSessions: 10, maxFailedLogins: 15,
    lockoutDurationMs: 2 * 60 * 1000,
  },
  SUPER_ADMIN: {
    ticketsPerHour: Infinity, ticketsPerDay: Infinity,
    messagesPerHour: Infinity, messagesPerDay: Infinity,
    apiCallsPerMinute: Infinity,
    ticketCooldownMs: [0, 0],
    messageCooldownMs: [0, 0],
    maxSessions: 20, maxFailedLogins: 20,
    lockoutDurationMs: 0,
  },
};

// Returns randomised cooldown within role's range (anti-burst, anti-bot)
export function getRandomCooldownMs(role: string, action: 'ticket' | 'message'): number {
  const limits = ROLE_LIMITS[role] ?? ROLE_LIMITS.CUSTOMER;
  const [min, max] = action === 'ticket' ? limits.ticketCooldownMs : limits.messageCooldownMs;
  if (min === 0 && max === 0) return 0;
  const base = min + Math.random() * (max - min);
  const jitter = base * 0.2 * (Math.random() - 0.5) * 2;
  return Math.max(0, Math.round(base + jitter));
}

/**
 * ZenFlowAI — Fair Usage & Cooldown Enforcement
 *
 * Per-user, per-role quota system with randomised cooldown periods.
 * - Rolling window quotas (per minute, per hour, per day)
 * - Random cooldown between actions (anti-burst, anti-bot)
 * - Automatic quota reset when window expires
 * - Violations logged to DB + audit log
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { ROLE_LIMITS, getRandomCooldownMs } from './rbac';
import { auditFairUsage } from './audit';

type ActionType = 'CREATE_TICKET' | 'POST_COMMENT' | 'API_CALL';

// ─── Cooldown Check ───────────────────────────────────────────────────────────

export async function checkCooldown(userId: number, role: string, action: ActionType): Promise<void> {
  const cooldownAction = action === 'CREATE_TICKET' ? 'ticket' : 'message';

  const active = await prisma.cooldownPeriod.findFirst({
    where: {
      userId,
      action,
      endsAt: { gt: new Date() },
    },
    orderBy: { endsAt: 'desc' },
  });

  if (active) {
    const remainingMs = active.endsAt.getTime() - Date.now();
    const remainingSec = Math.ceil(remainingMs / 1000);

    await auditFairUsage('COOLDOWN_BLOCKED', {
      actorId: userId,
      message: `Action ${action} blocked by cooldown. ${remainingSec}s remaining.`,
      metadata: { action, remainingMs, cooldownEndsAt: active.endsAt },
    });

    throw new GraphQLError(
      `Please wait ${remainingSec} seconds before ${action === 'CREATE_TICKET' ? 'creating another ticket' : 'posting another comment'}.`,
      {
        extensions: {
          code: 'COOLDOWN_ACTIVE',
          remainingMs,
          remainingSec,
          endsAt: active.endsAt.toISOString(),
        },
      }
    );
  }

  // Apply new cooldown for this action
  const cooldownMs = getRandomCooldownMs(role, cooldownAction as any);
  if (cooldownMs > 0) {
    const endsAt = new Date(Date.now() + cooldownMs);
    await prisma.cooldownPeriod.create({
      data: {
        userId,
        action,
        cooldownMs,
        endsAt,
        reason: `Role ${role} cooldown`,
      },
    });
  }
}

// ─── Quota Check ──────────────────────────────────────────────────────────────

export async function checkQuota(userId: number, role: string, action: ActionType): Promise<void> {
  const limits = ROLE_LIMITS[role] ?? ROLE_LIMITS.CUSTOMER;

  // Infinite quota for SUPER_ADMIN
  if (
    limits.ticketsPerHour === Infinity &&
    limits.ticketsPerDay === Infinity
  ) {
    return;
  }

  const now = new Date();

  // Upsert usage quota record
  let quota = await prisma.usageQuota.findUnique({ where: { userId } });
  if (!quota) {
    quota = await prisma.usageQuota.create({
      data: {
        userId,
        hourWindowStart: now,
        dayWindowStart: now,
        minuteWindowStart: now,
      },
    });
  }

  // Reset windows if expired
  const hourExpired = now.getTime() - quota.hourWindowStart.getTime() > 60 * 60 * 1000;
  const dayExpired = now.getTime() - quota.dayWindowStart.getTime() > 24 * 60 * 60 * 1000;
  const minExpired = now.getTime() - quota.minuteWindowStart.getTime() > 60 * 1000;

  const updateData: Record<string, unknown> = {};
  if (hourExpired) {
    updateData.ticketsThisHour = 0;
    updateData.messagesThisHour = 0;
    updateData.hourWindowStart = now;
  }
  if (dayExpired) {
    updateData.ticketsToday = 0;
    updateData.messagesToday = 0;
    updateData.dayWindowStart = now;
  }
  if (minExpired) {
    updateData.apiCallsThisMinute = 0;
    updateData.minuteWindowStart = now;
  }

  if (Object.keys(updateData).length > 0) {
    quota = await prisma.usageQuota.update({
      where: { userId },
      data: updateData as any,
    });
  }

  // ── Check limits ────────────────────────────────────────────────────────────

  if (action === 'CREATE_TICKET') {
    if (quota.ticketsThisHour >= limits.ticketsPerHour) {
      await logQuotaViolation(userId, action, 'HOURLY_QUOTA');
      throw new GraphQLError(
        `You have reached the hourly ticket limit (${limits.ticketsPerHour}). Please try again later.`,
        { extensions: { code: 'QUOTA_EXCEEDED', limit: limits.ticketsPerHour, window: 'hour' } }
      );
    }
    if (quota.ticketsToday >= limits.ticketsPerDay) {
      await logQuotaViolation(userId, action, 'DAILY_QUOTA');
      throw new GraphQLError(
        `You have reached the daily ticket limit (${limits.ticketsPerDay}).`,
        { extensions: { code: 'QUOTA_EXCEEDED', limit: limits.ticketsPerDay, window: 'day' } }
      );
    }

    // Increment counters
    await prisma.usageQuota.update({
      where: { userId },
      data: {
        ticketsThisHour: { increment: 1 },
        ticketsToday: { increment: 1 },
      },
    });
  }

  if (action === 'POST_COMMENT') {
    if (quota.messagesThisHour >= limits.messagesPerHour) {
      await logQuotaViolation(userId, action, 'HOURLY_QUOTA');
      throw new GraphQLError(
        `You have reached the hourly message limit (${limits.messagesPerHour}).`,
        { extensions: { code: 'QUOTA_EXCEEDED', limit: limits.messagesPerHour, window: 'hour' } }
      );
    }
    if (quota.messagesToday >= limits.messagesPerDay) {
      await logQuotaViolation(userId, action, 'DAILY_QUOTA');
      throw new GraphQLError(
        `You have reached the daily message limit (${limits.messagesPerDay}).`,
        { extensions: { code: 'QUOTA_EXCEEDED', limit: limits.messagesPerDay, window: 'day' } }
      );
    }

    await prisma.usageQuota.update({
      where: { userId },
      data: {
        messagesThisHour: { increment: 1 },
        messagesToday: { increment: 1 },
      },
    });
  }

  if (action === 'API_CALL') {
    if (quota.apiCallsThisMinute >= limits.apiCallsPerMinute) {
      await logQuotaViolation(userId, action, 'RATE_LIMIT');
      throw new GraphQLError(
        `API rate limit exceeded. Maximum ${limits.apiCallsPerMinute} requests per minute.`,
        { extensions: { code: 'RATE_LIMIT_EXCEEDED', limit: limits.apiCallsPerMinute, window: 'minute' } }
      );
    }
    await prisma.usageQuota.update({
      where: { userId },
      data: { apiCallsThisMinute: { increment: 1 }, apiCallsToday: { increment: 1 } },
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logQuotaViolation(userId: number, action: ActionType, type: string) {
  try {
    await Promise.all([
      prisma.usageQuota.update({
        where: { userId },
        data: { quotaViolations: { increment: 1 }, lastViolationAt: new Date() },
      }),
      prisma.rateLimitViolation.create({
        data: {
          userId,
          ip: 'unknown',
          endpoint: action,
          violationType: type,
          requestCount: 0,
          windowStart: new Date(),
        },
      }),
      auditFairUsage(`QUOTA_EXCEEDED_${type}`, {
        actorId: userId,
        message: `User #${userId} hit ${type} for action ${action}`,
        metadata: { action, type },
      }),
    ]);
  } catch {
    // Non-critical
  }
}

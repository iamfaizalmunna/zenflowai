import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { RoutingRuleType, TicketPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { audit } from '../security/audit';

export async function listTeams() {
  return prisma.team.findMany({
    include: { members: { include: { user: { select: { id: true, name: true, role: true } } } } },
    orderBy: { id: 'asc' },
  });
}

export async function saveTeam(
  ctx: Context,
  input: { name: string; description?: string; isDefault?: boolean },
  id?: number
) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const name = input.name.trim();
  if (name.length < 2) throw new GraphQLError('Name is required', { extensions: { code: 'BAD_USER_INPUT' } });

  if (input.isDefault) {
    await prisma.team.updateMany({ data: { isDefault: false } });
  }

  const team = id
    ? await prisma.team.update({
        where: { id },
        data: { name, description: input.description, isDefault: input.isDefault ?? false },
      })
    : await prisma.team.create({
        data: { name, description: input.description, isDefault: input.isDefault ?? false },
      });

  await audit({
    action: id ? 'TEAM_UPDATED' : 'TEAM_CREATED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'Team',
    targetId: team.id,
    message: `${team.name} saved`,
  });
  return team;
}

export async function listRoutingRules() {
  return prisma.routingRule.findMany({
    include: { targetTeam: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } },
    orderBy: { order: 'asc' },
  });
}

const ruleSchema = z.object({
  type: z.nativeEnum(RoutingRuleType),
  keyword: z.string().max(80).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  priority: z.nativeEnum(TicketPriority).optional().nullable(),
  targetTeamId: z.number().int().positive(),
  order: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export async function saveRoutingRule(ctx: Context, raw: unknown, id?: number) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const input = ruleSchema.parse(raw);
  const data = {
    type: input.type,
    keyword: input.keyword ?? null,
    categoryId: input.categoryId ?? null,
    priority: input.priority ?? null,
    targetTeamId: input.targetTeamId,
    order: input.order ?? 100,
    isActive: input.isActive ?? true,
  };
  const rule = id
    ? await prisma.routingRule.update({ where: { id }, data, include: { targetTeam: true, category: true } })
    : await prisma.routingRule.create({ data, include: { targetTeam: true, category: true } });

  await audit({
    action: id ? 'ROUTING_UPDATED' : 'ROUTING_CREATED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'RoutingRule',
    targetId: rule.id,
    message: `Routing rule #${rule.id} saved`,
  });
  return rule;
}

export async function listSlaPolicies() {
  return prisma.slaPolicy.findMany({ orderBy: { id: 'asc' } });
}

export async function updateSlaPolicy(
  ctx: Context,
  priority: TicketPriority,
  responseTimeHours: number,
  resolutionTimeHours: number
) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const policy = await prisma.slaPolicy.update({
    where: { priority },
    data: { responseTimeHours, resolutionTimeHours },
  });
  await audit({
    action: 'SLA_UPDATED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'SlaPolicy',
    targetId: policy.id,
    message: `SLA ${priority} set to ${responseTimeHours}h / ${resolutionTimeHours}h`,
  });
  return policy;
}

export async function setUserActive(ctx: Context, id: number, isActive: boolean) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const user = await prisma.user.update({ where: { id }, data: { isActive } });
  await audit({
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'User',
    targetId: id,
    message: `User #${id} ${isActive ? 'activated' : 'deactivated'}`,
  });
  return user;
}

import { TicketPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { matchRoutingRule } from './routingMatch';

export { matchRoutingRule };
export type { RoutingRuleMatch } from './routingMatch';

export interface RoutingResult {
  teamId: number;
  assignedUserId: number | null;
  ruleId: number | null;
  reason: string;
  priorityOverride?: TicketPriority;
}

const OPEN_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'] as const;

export async function evaluateRouting(input: {
  title: string;
  description: string;
  categoryId?: number | null;
  priority: TicketPriority;
}): Promise<RoutingResult> {
  const rules = await prisma.routingRule.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  const matched = matchRoutingRule(rules, input);

  let teamId = matched?.targetTeamId;
  if (!teamId) {
    const fallbackTeam = await prisma.team.findFirst({ where: { isDefault: true } });
    teamId = fallbackTeam?.id;
  }
  if (!teamId) {
    const anyTeam = await prisma.team.findFirst({ orderBy: { id: 'asc' } });
    teamId = anyTeam?.id;
  }
  if (!teamId) {
    throw new Error('No support team is configured');
  }

  const assignedUserId = await pickAssignee(teamId);
  const reason = matched
    ? `Matched ${matched.type} rule #${matched.id}`
    : 'Default team fallback';

  return {
    teamId,
    assignedUserId,
    ruleId: matched?.id ?? null,
    reason,
    priorityOverride: matched?.priorityOverride ?? undefined,
  };
}

async function pickAssignee(teamId: number): Promise<number | null> {
  const ai = await prisma.teamMember.findFirst({
    where: {
      teamId,
      user: { isActive: true, isBanned: false, isAiConsultant: true },
    },
    select: { userId: true },
  });
  if (ai) return ai.userId;
  return pickLeastBusyAgent(teamId);
}

async function pickLeastBusyAgent(teamId: number): Promise<number | null> {
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      user: { isActive: true, isBanned: false, isAiConsultant: false, role: { in: ['AGENT', 'SUPERVISOR'] } },
    },
    select: { userId: true },
  });
  if (members.length === 0) return null;

  const loads = await Promise.all(
    members.map(async (member) => {
      const openCount = await prisma.ticket.count({
        where: {
          assignedToId: member.userId,
          status: { in: [...OPEN_STATUSES] },
        },
      });
      return { userId: member.userId, openCount };
    })
  );

  loads.sort((a, b) => a.openCount - b.openCount);
  return loads[0]?.userId ?? null;
}

export async function saveRoutingDecision(ticketId: number, result: RoutingResult): Promise<void> {
  await prisma.routingDecision.create({
    data: {
      ticketId,
      ruleId: result.ruleId,
      assignedTeamId: result.teamId,
      assignedUserId: result.assignedUserId,
      reason: result.reason,
    },
  });
}

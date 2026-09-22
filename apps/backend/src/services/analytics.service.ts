import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { requirePermission } from '../security/rbac';
import { audit } from '../security/audit';
import {
  average,
  buildKpis,
  clampRangeDays,
  countBy,
  csatBars,
  fillDayBuckets,
  fillWeekBuckets,
} from './analyticsMath';
import { consultantAssessment, consultantStats, isConsultantRole, rankLeaderboard } from './consultantStats';

function toConsultantRows(
  tickets: Array<{
    assignedToId: number | null;
    status: string;
    createdAt: Date;
    firstRespondedAt: Date | null;
    resolvedAt: Date | null;
    slaResponseBreached: boolean;
    slaResolutionBreached: boolean;
    csatSurvey: { rating: number; status: string } | null;
  }>,
) {
  return tickets.map((t) => ({
    assignedToId: t.assignedToId,
    status: t.status,
    createdAt: t.createdAt,
    firstRespondedAt: t.firstRespondedAt,
    resolvedAt: t.resolvedAt,
    csatRating: t.csatSurvey?.status === 'SUBMITTED' ? t.csatSurvey.rating : null,
    slaResponseBreached: t.slaResponseBreached,
    slaResolutionBreached: t.slaResolutionBreached,
  }));
}

function requireUser(ctx: Context): number {
  if (!ctx.userId) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.userId;
}

export async function getAnalytics(ctx: Context, rangeDays = 30) {
  requireUser(ctx);
  const days = clampRangeDays(rangeDays);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: since } },
    include: { category: { select: { name: true } }, csatSurvey: { select: { rating: true, status: true } } },
  });
  const open = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const slaBreached = tickets.filter((t) => t.slaResolutionBreached || t.slaResponseBreached).length;
  const ratings = tickets
    .map((t) => (t.csatSurvey?.status === 'SUBMITTED' ? t.csatSurvey.rating : null))
    .filter((n): n is number => n !== null);
  const unanswered = await prisma.knowledgeArticle.count({ where: { isPublished: false } });
  return {
    kpis: buildKpis({
      open,
      resolved,
      slaBreached,
      csatAverage: average(ratings),
      unanswered,
    }),
    volume: fillDayBuckets(new Date(), days, tickets.map((t) => t.createdAt)),
    byStatus: countBy(tickets.map((t) => t.status)),
    byPriority: countBy(tickets.map((t) => t.priority)),
    byCategory: countBy(tickets.map((t) => t.category?.name ?? 'None')),
    csatTrend: csatBars(ratings),
    sla: countBy(tickets.map((t) => (t.slaResolutionBreached ? 'Breached' : 'On track'))),
  };
}

export async function listConsultants(ctx: Context) {
  requirePermission(ctx.role, 'consultant:read', ctx.permissionOverrides);
  const users = await prisma.user.findMany({
    where: { role: { in: ['AGENT', 'SUPERVISOR'] } },
    include: {
      assignedTickets: {
        include: { csatSurvey: { select: { rating: true, status: true } } },
      },
      teamMembers: { include: { team: { select: { name: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  return users.map((user) => {
    const rows = toConsultantRows(user.assignedTickets);
    const stats = consultantStats(rows, user.id);
    const assessment = consultantAssessment(rows, user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      teams: user.teamMembers.map((m) => m.team.name),
      ...stats,
      assessmentIndex: assessment.index,
    };
  });
}

export async function getConsultantProfile(ctx: Context, id: number) {
  requirePermission(ctx.role, 'consultant:read', ctx.permissionOverrides);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      assignedTickets: {
        include: { csatSurvey: { select: { rating: true, status: true, comment: true } }, category: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
      },
      teamMembers: { include: { team: { select: { name: true } } } },
    },
  });
  if (!user || !isConsultantRole(user.role)) {
    throw new GraphQLError('Consultant not found', { extensions: { code: 'NOT_FOUND' } });
  }
  await audit({
    action: 'CONSULTANT_PROFILE_VIEWED',
    category: 'ACCESS',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'User',
    targetId: id,
    message: `Admin viewed consultant profile #${id}`,
  });
  const rows = toConsultantRows(user.assignedTickets);
  const stats = consultantStats(rows, user.id);
  const assessment = consultantAssessment(rows, user.id);
  const completed = user.assignedTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    teams: user.teamMembers.map((m) => m.team.name),
    ...stats,
    assessmentIndex: assessment.index,
    assessment: assessment.axes,
    gaps: assessment.gaps,
    resolvedWeekly: fillWeekBuckets(
      new Date(),
      16,
      completed.map((t) => t.resolvedAt ?? t.updatedAt),
    ),
    createdWeekly: fillWeekBuckets(
      new Date(),
      16,
      user.assignedTickets.map((t) => t.createdAt),
    ),
    byStatus: countBy(user.assignedTickets.map((t) => t.status)),
    byCategory: countBy(user.assignedTickets.map((t) => t.category?.name ?? 'None')),
    csatBars: csatBars(rows.map((r) => r.csatRating).filter((n): n is number => n !== null)),
    sla: countBy(user.assignedTickets.map((t) => (t.slaResolutionBreached || t.slaResponseBreached ? 'Breached' : 'On track'))),
    completed: completed.slice(0, 20).map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      csatRating: t.csatSurvey?.status === 'SUBMITTED' ? t.csatSurvey.rating : null,
      resolvedAt: t.resolvedAt,
      csatComment: t.csatSurvey?.status === 'SUBMITTED' ? t.csatSurvey.comment : null,
    })),
  };
}

export async function getLeaderboard(ctx: Context) {
  requirePermission(ctx.role, 'analytics:read:team', ctx.permissionOverrides);
  const users = await prisma.user.findMany({
    where: { role: { in: ['AGENT', 'SUPERVISOR'] } },
    include: {
      assignedTickets: {
        include: { csatSurvey: { select: { rating: true, status: true } } },
      },
      teamMembers: { include: { team: { select: { name: true } } } },
    },
  });
  const rows = users.map((user) => {
    const tickets = toConsultantRows(user.assignedTickets);
    const stats = consultantStats(tickets, user.id);
    const assessment = consultantAssessment(tickets, user.id);
    const ratings = tickets.map((t) => t.csatRating).filter((n): n is number => n !== null);
    return {
      id: user.id,
      name: user.name,
      teams: user.teamMembers.map((m) => m.team.name),
      ...stats,
      assessmentIndex: assessment.index,
      detractors: ratings.filter((n) => n <= 2).length,
      promoters: ratings.filter((n) => n >= 4).length,
    };
  });
  return rankLeaderboard(rows);
}

export async function listCustomerFeedback(ctx: Context) {
  requirePermission(ctx.role, 'analytics:read:team', ctx.permissionOverrides);
  const surveys = await prisma.csatSurvey.findMany({
    where: { status: 'SUBMITTED', rating: { not: null } },
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          assignedTo: { select: { name: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 40,
  });
  return surveys.map((row) => ({
    id: row.id,
    ticketId: row.ticket.id,
    ticketNumber: row.ticket.ticketNumber,
    title: row.ticket.title,
    status: row.ticket.status,
    rating: row.rating ?? 0,
    comment: row.comment,
    consultantName: row.ticket.assignedTo?.name ?? null,
    submittedAt: row.submittedAt,
  }));
}

export async function listAuditLogs(ctx: Context, page = 1, pageSize = 30) {
  requirePermission(ctx.role, 'audit:read:all', ctx.permissionOverrides);
  const take = Math.min(pageSize, 50);
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
    prisma.auditLog.count(),
  ]);
  return { rows, total, page, pageSize: take };
}

export async function listBlockedIps(ctx: Context) {
  requirePermission(ctx.role, 'ip:read', ctx.permissionOverrides);
  return prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function blockIp(ctx: Context, ip: string, reason: string) {
  requirePermission(ctx.role, 'ip:block', ctx.permissionOverrides);
  const row = await prisma.blockedIp.upsert({
    where: { ip },
    create: { ip, reason, blockedById: ctx.userId },
    update: { reason, blockedById: ctx.userId, expiresAt: null },
  });
  await audit({
    action: 'IP_BLOCKED',
    category: 'SECURITY',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'BlockedIp',
    targetId: row.id,
    message: `Blocked ${ip}: ${reason}`,
  });
  return row;
}

export async function unblockIp(ctx: Context, id: number) {
  requirePermission(ctx.role, 'ip:unblock', ctx.permissionOverrides);
  const row = await prisma.blockedIp.delete({ where: { id } });
  await audit({
    action: 'IP_UNBLOCKED',
    category: 'SECURITY',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'BlockedIp',
    targetId: id,
    message: `Unblocked ${row.ip}`,
  });
  return row;
}

export async function listSpamReports(ctx: Context) {
  requirePermission(ctx.role, 'spam:review', ctx.permissionOverrides);
  return prisma.spamReport.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function reviewSpam(ctx: Context, id: number, status: 'CONFIRMED' | 'DISMISSED', note?: string) {
  requirePermission(ctx.role, status === 'CONFIRMED' ? 'spam:confirm' : 'spam:dismiss', ctx.permissionOverrides);
  const row = await prisma.spamReport.update({
    where: { id },
    data: { status, reviewedById: ctx.userId, reviewedAt: new Date(), reviewNote: note ?? null },
  });
  await audit({
    action: 'SPAM_REVIEWED',
    category: 'MODERATION',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'SpamReport',
    targetId: id,
    message: `Spam #${id} ${status}`,
  });
  return row;
}

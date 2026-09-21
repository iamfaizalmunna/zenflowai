import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { csatExpiresAt, clampCsatRating, isCsatOpen } from './csatRules';

export async function openCsatForTicket(ticketId: number, customerId: number): Promise<void> {
  const existing = await prisma.csatSurvey.findUnique({ where: { ticketId } });
  if (existing) return;
  const now = new Date();
  await prisma.csatSurvey.create({
    data: {
      ticketId,
      customerId,
      expiresAt: csatExpiresAt(now),
      status: 'PENDING',
    },
  });
  await prisma.notification.create({
    data: {
      userId: customerId,
      type: 'CSAT_REQUEST',
      ticketId,
      title: 'How did we do?',
      body: 'Please rate your support experience.',
    },
  }).catch(() => undefined);
}

export async function pendingCsats(ctx: Context) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const now = new Date();
  return prisma.csatSurvey.findMany({
    where: { customerId: ctx.userId, status: 'PENDING', expiresAt: { gt: now } },
    include: { ticket: { select: { id: true, ticketNumber: true, title: true } } },
    take: 10,
  });
}

export async function submitCsat(ctx: Context, surveyId: number, rating: number, comment?: string) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const survey = await prisma.csatSurvey.findUnique({ where: { id: surveyId } });
  if (!survey || survey.customerId !== ctx.userId) {
    throw new GraphQLError('Survey not found', { extensions: { code: 'NOT_FOUND' } });
  }
  if (!isCsatOpen(survey.expiresAt, survey.status === 'SUBMITTED', new Date())) {
    throw new GraphQLError('This survey is closed', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  return prisma.csatSurvey.update({
    where: { id: surveyId },
    data: {
      rating: clampCsatRating(rating),
      comment: comment?.slice(0, 2000) ?? null,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
    include: { ticket: { select: { id: true, ticketNumber: true, title: true } } },
  });
}

export async function csatSummary(ctx: Context) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const [pending, submitted, avg] = await Promise.all([
    prisma.csatSurvey.count({ where: { status: 'PENDING' } }),
    prisma.csatSurvey.count({ where: { status: 'SUBMITTED' } }),
    prisma.csatSurvey.aggregate({
      where: { status: 'SUBMITTED', rating: { not: null } },
      _avg: { rating: true },
    }),
  ]);
  return {
    pending,
    submitted,
    averageRating: avg._avg.rating ?? 0,
  };
}

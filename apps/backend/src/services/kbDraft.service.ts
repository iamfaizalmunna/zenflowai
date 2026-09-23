import { ArticleVisibility } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { audit } from '../security/audit';
import { getTicket } from './ticket.service';
import { buildKbDraftFromTicket } from './ai/kbDraft';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export async function promoteTicketToKbDraft(ctx: Context, ticketId: number) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const ticket = await getTicket(ctx, ticketId);
  const draft = buildKbDraftFromTicket({
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    description: ticket.description,
    replies: (ticket.messages ?? []).map(
      (m: { body: string; type: string; sender?: { role?: string; isAiConsultant?: boolean } }) => ({
        body: m.body,
        type: m.type,
        isStaff: STAFF.has(m.sender?.role ?? ''),
        isAi: Boolean(m.sender?.isAiConsultant),
      })
    ),
  });
  if (!draft) {
    throw new GraphQLError('Need a staff reply on the ticket before saving a help draft', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const existing = await prisma.knowledgeArticle.findFirst({
    where: { title: draft.title, isPublished: false },
  });
  if (existing) return existing;

  const article = await prisma.knowledgeArticle.create({
    data: {
      title: draft.title,
      body: draft.body,
      visibility: ArticleVisibility.INTERNAL,
      isPublished: false,
      authorId: ctx.userId,
    },
  });

  await audit({
    action: 'KB_DRAFT_FROM_TICKET',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'KnowledgeArticle',
    targetId: article.id,
    message: `Draft from ${ticket.ticketNumber} (internal, unpublished)`,
  });

  return article;
}

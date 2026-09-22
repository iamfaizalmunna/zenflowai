import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GraphQLError } from 'graphql';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { audit } from '../security/audit';
import {
  assertInsideUploadDir,
  attachmentStoragePath,
  decodeBase64File,
  maxUploadBytes,
  resolveUploadDir,
  safeUploadFilename,
} from '../utils/uploadPath';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

async function assertTicketAccess(ctx: Context, ticketId: number) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new GraphQLError('Ticket not found', { extensions: { code: 'NOT_FOUND' } });
  if (!STAFF.has(ctx.role) && ticket.customerId !== ctx.userId) {
    throw new GraphQLError('You do not have access to this ticket', { extensions: { code: 'FORBIDDEN' } });
  }
  return ticket;
}

export async function listAttachments(ctx: Context, ticketId: number) {
  await assertTicketAccess(ctx, ticketId);
  return prisma.attachment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function uploadTicketAttachment(
  ctx: Context,
  input: { ticketId: number; filename: string; mimeType: string; contentBase64: string }
) {
  if (!ctx.userId) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  await assertTicketAccess(ctx, input.ticketId);

  const filename = safeUploadFilename(input.filename);
  const bytes = decodeBase64File(input.contentBase64);
  if (bytes.length === 0) {
    throw new GraphQLError('File is empty', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  if (bytes.length > maxUploadBytes()) {
    throw new GraphQLError('File is too large', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const relative = attachmentStoragePath(input.ticketId, filename);
  const full = path.join(resolveUploadDir(), relative);
  assertInsideUploadDir(full);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);

  const row = await prisma.attachment.create({
    data: {
      ticketId: input.ticketId,
      filename,
      storagePath: relative,
      mimeType: input.mimeType.slice(0, 120) || 'application/octet-stream',
      sizeBytes: bytes.length,
      uploadedById: ctx.userId,
    },
  });

  await audit({
    action: 'TICKET_ATTACHMENT_UPLOADED',
    category: 'TICKET',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'Ticket',
    targetId: input.ticketId,
    message: `Attachment ${filename} stored locally`,
  });

  return row;
}

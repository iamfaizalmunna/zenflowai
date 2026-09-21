import { prisma } from './prisma';

export async function generateTicketNumber(): Promise<string> {
  const last = await prisma.ticket.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const next = (last?.id ?? 0) + 1;
  return `#ZEN-${String(next).padStart(4, '0')}`;
}

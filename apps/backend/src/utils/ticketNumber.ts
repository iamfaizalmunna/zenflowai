import { prisma } from './prisma';
import { formatTicketNumber } from './ticketNumberFormat';

export { formatTicketNumber };

export async function generateTicketNumber(): Promise<string> {
  const last = await prisma.ticket.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const next = (last?.id ?? 0) + 1;
  return formatTicketNumber(next);
}

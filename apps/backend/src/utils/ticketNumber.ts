import { formatTicketNumber } from './ticketNumberFormat';

export { formatTicketNumber };

export interface TicketNumberStore {
  ticket: {
    findFirst: (args: {
      orderBy: { id: 'desc' };
      select: { id: true };
    }) => Promise<{ id: number } | null>;
  };
}

export async function generateTicketNumber(db: TicketNumberStore): Promise<string> {
  const last = await db.ticket.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  return formatTicketNumber((last?.id ?? 0) + 1);
}

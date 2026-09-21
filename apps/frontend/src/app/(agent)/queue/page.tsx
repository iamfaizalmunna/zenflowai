'use client';

import { useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS, TICKET_CREATED } from '@/modules/tickets/queries/ticket.queries';
import { TicketBrowseBar } from '@/modules/tickets/components/TicketBrowseBar';
import { TicketCard, ticketGridClass } from '@/modules/tickets/components/TicketCard';
import { PageTitle } from '@/components/ui/Field';
import { useAppearance } from '@/hooks/useAppearance';
import { sortTickets, type TicketSort, type TicketView } from '@/lib/appearance';

export default function AgentQueuePage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { prefs, update } = useAppearance();
  const { data, loading, refetch } = useQuery(GET_TICKETS, {
    variables: {
      page: 1,
      pageSize: 40,
      filter: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
    },
  });

  useSubscription(TICKET_CREATED, {
    onData: () => { void refetch(); },
  });

  const tickets = sortTickets(data?.tickets?.tickets ?? [], prefs.ticketSort);

  return (
    <RoleGuard minRole="AGENT">
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <PageTitle title="Ticket queue" hint={`${data?.tickets?.total ?? 0} tickets`} />
            <TicketBrowseBar
              status={status}
              priority={priority}
              sort={prefs.ticketSort}
              view={prefs.ticketView}
              onStatus={setStatus}
              onPriority={setPriority}
              onSort={(value: TicketSort) => update({ ticketSort: value })}
              onView={(value: TicketView) => update({ ticketView: value })}
            />
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading queue…</p>}
          <div className={ticketGridClass(prefs.ticketView)}>
            {tickets.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} view={prefs.ticketView} />
            ))}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

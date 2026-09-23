'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketBrowseBar, TicketViewSwitch } from '@/modules/tickets/components/TicketBrowseBar';
import { TicketCard, ticketGridClass, type TicketListItem } from '@/modules/tickets/components/TicketCard';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { PageTitle } from '@/components/ui/Field';
import { useAppearance } from '@/hooks/useAppearance';
import { sortTickets, type TicketSort, type TicketView } from '@/lib/appearance';
import { filterByQuery } from '@/lib/listSearch';

export default function MyTicketsPage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [query, setQuery] = useState('');
  const { prefs, update } = useAppearance();
  const { data, loading } = useQuery(GET_TICKETS, {
    variables: {
      filter: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      page: 1,
      pageSize: 30,
    },
  });

  const tickets = filterByQuery(
    sortTickets<TicketListItem>(data?.tickets?.tickets ?? [], prefs.ticketSort),
    query,
    (ticket) => `${ticket.ticketNumber} ${ticket.title} ${ticket.category?.name ?? ''}`,
  );

  return (
    <RoleGuard minRole="CUSTOMER">
        <div className="page-stack">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <PageTitle title="My tickets" />
            <TicketViewSwitch view={prefs.ticketView} onView={(value: TicketView) => update({ ticketView: value })} />
          </div>
          <div className="flex min-w-0 flex-col gap-2 app:flex-row app:flex-wrap app:items-center">
            <ListSearch className="min-w-0 flex-1" value={query} onChange={setQuery} placeholder="Search this pack…" />
            <TicketBrowseBar
              status={status}
              priority={priority}
              sort={prefs.ticketSort}
              view={prefs.ticketView}
              onStatus={setStatus}
              onPriority={setPriority}
              onSort={(value: TicketSort) => update({ ticketSort: value })}
              onView={(value: TicketView) => update({ ticketView: value })}
              showView={false}
            />
          </div>
          {loading && !data ? <PageSkeleton /> : (
          <div className={ticketGridClass(prefs.ticketView)}>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} view={prefs.ticketView} />
            ))}
          </div>
          )}
        </div>
    </RoleGuard>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS, TICKET_CREATED } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';

export default function AgentQueuePage() {
  const [status, setStatus] = useState('');
  const { data, loading, refetch } = useQuery(GET_TICKETS, {
    variables: {
      page: 1,
      pageSize: 40,
      filter: status ? { status } : undefined,
    },
  });

  useSubscription(TICKET_CREATED, {
    onData: () => { void refetch(); },
  });

  return (
    <RoleGuard minRole="AGENT">
      <AppShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ticket queue</h1>
              <p className="text-sm text-slate-500">{data?.tickets?.total ?? 0} tickets</p>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="ON_HOLD">On hold</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          {loading && <p className="text-sm text-slate-400">Loading queue…</p>}
          <div className="space-y-2">
            {data?.tickets?.tickets?.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} />
            ))}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

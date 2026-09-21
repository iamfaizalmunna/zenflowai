'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';

export default function MyTicketsPage() {
  const [status, setStatus] = useState('');
  const { data, loading } = useQuery(GET_TICKETS, {
    variables: {
      filter: status ? { status } : {},
      page: 1,
      pageSize: 30,
    },
  });

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">My tickets</h1>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
            >
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
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

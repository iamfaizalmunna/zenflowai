'use client';

import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';

export default function AgentQueuePage() {
  const { data, loading } = useQuery(GET_TICKETS, {
    variables: { page: 1, pageSize: 40 },
  });

  return (
    <RoleGuard minRole="AGENT">
      <AppShell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Ticket queue</h1>
          <p className="text-sm text-slate-500">{data?.tickets?.total ?? 0} tickets</p>
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

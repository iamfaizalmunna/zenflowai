'use client';

import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';
import { remainingMs } from '@/lib/countdown';

export default function SupervisorHome() {
  const { data, loading } = useQuery(GET_TICKETS, {
    variables: { page: 1, pageSize: 50 },
  });

  const dueSoon = (data?.tickets?.tickets ?? []).filter(
    (ticket: { slaResolutionDueAt?: string | null; status: string }) => {
      if (!ticket.slaResolutionDueAt) return false;
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return false;
      const ms = remainingMs(ticket.slaResolutionDueAt);
      return ms < 8 * 60 * 60 * 1000;
    }
  );

  return (
    <RoleGuard minRole="SUPERVISOR">
      <AppShell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">SLA watch</h1>
          <p className="text-sm text-slate-500">Open tickets due within 8 hours (or already overdue).</p>
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          <div className="space-y-2">
            {dueSoon.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} />
            ))}
            {!loading && dueSoon.length === 0 && (
              <p className="text-sm text-slate-400">Nothing due soon.</p>
            )}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

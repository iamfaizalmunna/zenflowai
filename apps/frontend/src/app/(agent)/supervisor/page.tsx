'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { CSAT_SUMMARY } from '@/modules/admin/queries/admin.queries';
import { ANALYTICS } from '@/modules/analytics/queries/analytics.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';
import { remainingMs } from '@/lib/countdown';

export default function SupervisorHome() {
  const { data, loading } = useQuery(GET_TICKETS, {
    variables: { page: 1, pageSize: 50 },
  });
  const { data: csat } = useQuery(CSAT_SUMMARY);
  const { data: snap } = useQuery(ANALYTICS, { variables: { rangeDays: 30 } });

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
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <PageTitle title="SLA watch" hint="Open tickets due within 8 hours. Charts live on Analytics." />
            <Link href="/analytics" className="text-sm font-medium text-iris">Open analytics</Link>
          </div>
          <div className="grid grid-cols-2 app:grid-cols-4 gap-3">
            {snap?.analytics?.kpis?.slice(0, 4).map((kpi: { id: string; label: string; value: number }) => (
              <div key={kpi.id} className="surface rounded-3xl border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="font-display text-2xl mt-1">{kpi.value}</p>
              </div>
            ))}
            {csat?.csatSummary && (
              <div className="surface rounded-3xl border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">CSAT pending</p>
                <p className="font-display text-2xl mt-1">{csat.csatSummary.pending}</p>
              </div>
            )}
          </div>
          {loading && !data ? <PageSkeleton /> : (
          <div className="space-y-2">
            {dueSoon.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} />
            ))}
            {!loading && dueSoon.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing due soon.</p>
            )}
          </div>
          )}
        </div>
    </RoleGuard>
  );
}

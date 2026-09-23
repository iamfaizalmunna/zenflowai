'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { TICKET_COUNTS, GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard, ticketGridClass } from '@/modules/tickets/components/TicketCard';
import { CsatBanner } from '@/modules/tickets/components/CsatBanner';
import { useAuthStore } from '@/store/auth.store';
import { useAppearance } from '@/hooks/useAppearance';

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const { prefs } = useAppearance();
  const { data: counts } = useQuery(TICKET_COUNTS);
  const { data, loading } = useQuery(GET_TICKETS, { variables: { page: 1, pageSize: 5 } });

  const stats = [
    { label: 'Open', value: counts?.ticketCounts?.open ?? '—', color: 'text-blue-600' },
    { label: 'Waiting', value: counts?.ticketCounts?.waiting ?? '—', color: 'text-amber-600' },
    { label: 'Resolved', value: counts?.ticketCounts?.resolved ?? '—', color: 'text-emerald-600' },
  ];

  return (
    <RoleGuard minRole="CUSTOMER">
        <div className="page-stack">
          <div className="flex items-start justify-between gap-4">
            <PageTitle title={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`} hint="Your recent support tickets." />
            <Link href="/tickets/new" className="hidden min-h-10 items-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground app:inline-flex">
              New ticket
            </Link>
          </div>

          <CsatBanner />

          <div className="grid grid-cols-3 gap-2 app:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="surface-card p-3 app:p-5">
                <p className="type-meta">{stat.label}</p>
                <p className={`mt-1 text-xl font-semibold tabular-nums app:text-3xl ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className={ticketGridClass(prefs.ticketView)}>
            {loading && <p className="text-sm text-muted-foreground">Loading tickets…</p>}
            {data?.tickets?.tickets?.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} view={prefs.ticketView} />
            ))}
            {!loading && data?.tickets?.tickets?.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">No tickets yet. Create one to get help.</p>
            )}
          </div>
        </div>
    </RoleGuard>
  );
}

'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
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
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl app:text-3xl tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-muted-foreground mt-1 text-sm">Your recent support tickets.</p>
            </div>
            <Link href="/tickets/new" className="hidden app:inline-flex px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium min-h-11 items-center">
              New ticket
            </Link>
          </div>

          <CsatBanner />

          <div className="grid grid-cols-3 gap-2 app:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-3 app:p-5">
                <p className="text-[11px] app:text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-xl app:text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
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
      </AppShell>
    </RoleGuard>
  );
}

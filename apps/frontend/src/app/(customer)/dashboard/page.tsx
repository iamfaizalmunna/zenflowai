'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { TICKET_COUNTS, GET_TICKETS } from '@/modules/tickets/queries/ticket.queries';
import { TicketCard } from '@/modules/tickets/components/TicketCard';
import { useAuthStore } from '@/store/auth.store';

export default function CustomerDashboardPage() {
  const { user } = useAuthStore();
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
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-slate-500 mt-1 text-sm">Your recent support tickets.</p>
            </div>
            <Link href="/tickets/new" className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium">
              New ticket
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {loading && <p className="text-sm text-slate-400">Loading tickets…</p>}
            {data?.tickets?.tickets?.map((ticket: Parameters<typeof TicketCard>[0]['ticket']) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/tickets/${ticket.id}`} />
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

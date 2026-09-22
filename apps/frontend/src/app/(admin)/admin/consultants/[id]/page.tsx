'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { ChartCard } from '@/modules/analytics/components/ChartCard';
import { CONSULTANT_PROFILE } from '@/modules/analytics/queries/analytics.queries';
import type { ChartType } from '@/lib/analytics';
import { formatRelativeTime } from '@/lib/utils';

export default function ConsultantProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, loading } = useQuery(CONSULTANT_PROFILE, { variables: { id }, skip: !id });
  const [types, setTypes] = useState<Record<string, ChartType>>({
    week: 'AREA',
    status: 'DONUT',
    csat: 'BAR',
  });
  const p = data?.consultantProfile;

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-5">
          <Link href="/admin/consultants" className="text-sm text-muted-foreground hover:text-foreground">
            ← Directory
          </Link>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {p && (
            <>
              <PageTitle title={p.name} hint={`${p.role} · ${p.teams.join(', ') || 'No team'} · ${p.email}`} />
              <div className="flex flex-wrap gap-2">
                <Link href="/queue" className="inline-flex min-h-12 items-center px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-medium">
                  Open assigned tickets
                </Link>
                <p className="text-xs text-muted-foreground self-center">
                  Last login {p.lastLoginAt ? formatRelativeTime(p.lastLoginAt) : 'never'}
                </p>
              </div>
              <div className="grid grid-cols-2 app:grid-cols-6 gap-3">
                {[
                  ['Open', p.openCount],
                  ['Resolved', p.resolvedCount],
                  ['Closed', p.closedCount],
                  ['1st reply h', p.avgFirstResponseHours],
                  ['Resolve h', p.avgResolveHours],
                  ['CSAT', p.csatCount ? `${p.csatAverage} (n=${p.csatCount})` : '—'],
                ].map(([label, value]) => (
                  <div key={String(label)} className="surface rounded-3xl border border-border/70 p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-display text-xl mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 app:grid-cols-3">
                <ChartCard title="Resolved" data={p.resolvedWeekly} type={types.week} onType={(t) => setTypes((s) => ({ ...s, week: t }))} />
                <ChartCard title="Status" data={p.byStatus} type={types.status} onType={(t) => setTypes((s) => ({ ...s, status: t }))} />
                <ChartCard title="CSAT" data={p.csatBars} type={types.csat} onType={(t) => setTypes((s) => ({ ...s, csat: t }))} />
              </div>
              <section className="surface rounded-3xl border border-border/70 p-4 space-y-2">
                <h2 className="font-display text-lg">Completed tickets</h2>
                {p.completed.length === 0 && <p className="text-sm text-muted-foreground">No resolved tickets yet.</p>}
                {p.completed.map((t: { id: number; ticketNumber: string; title: string; csatRating?: number | null; resolvedAt?: string | null }) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="block rounded-2xl border border-border/50 px-3 py-2 hover:border-iris/40">
                    <p className="text-xs font-mono text-muted-foreground">{t.ticketNumber}</p>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.csatRating ? `CSAT ${t.csatRating}` : 'No rating'} · {t.resolvedAt ? formatRelativeTime(t.resolvedAt) : ''}
                    </p>
                  </Link>
                ))}
              </section>
            </>
          )}
        </div>
      </AppShell>
    </RoleGuard>
  );
}

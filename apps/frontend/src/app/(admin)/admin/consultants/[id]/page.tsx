'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { ChartCard } from '@/modules/analytics/components/ChartCard';
import { KpiTile } from '@/modules/analytics/components/KpiTile';
import { CONSULTANT_PROFILE } from '@/modules/analytics/queries/analytics.queries';
import type { ChartType } from '@/lib/analytics';
import { formatRelativeTime } from '@/lib/utils';

export default function ConsultantProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, loading } = useQuery(CONSULTANT_PROFILE, { variables: { id }, skip: !id });
  const [types, setTypes] = useState<Record<string, ChartType>>({
    score: 'RADAR',
    week: 'AREA',
    created: 'AREA',
    status: 'DONUT',
    category: 'DONUT',
    csat: 'BAR',
    sla: 'DONUT',
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
              <div className="flex flex-col app:flex-row app:items-end justify-between gap-3">
                <PageTitle title={p.name} hint={`${p.role.replace('_', ' ')} · ${p.teams.join(', ') || 'No team'} · ${p.email}`} />
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/queue" className="inline-flex min-h-10 items-center px-3.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/60">
                    Assigned queue
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Last login {p.lastLoginAt ? formatRelativeTime(p.lastLoginAt) : 'never'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 app:grid-cols-7 gap-2">
                <KpiTile label="Index" value={p.assessmentIndex} hint="Work + CSAT + SLA" />
                <KpiTile label="Open" value={p.openCount} />
                <KpiTile label="Solved" value={p.resolvedCount} />
                <KpiTile label="Closed" value={p.closedCount} />
                <KpiTile label="1st reply" value={`${p.avgFirstResponseHours}h`} />
                <KpiTile label="Resolve" value={`${p.avgResolveHours}h`} />
                <KpiTile label="CSAT" value={p.csatCount ? p.csatAverage : '—'} hint={p.csatCount ? `${p.csatCount} scores` : undefined} />
              </div>
              <div className="grid gap-3 app:grid-cols-2">
                <ChartCard
                  kind="score"
                  headline={p.assessmentIndex}
                  title="Assessment"
                  hint="Close, CSAT, speed, SLA, backlog"
                  data={p.assessment}
                  type={types.score}
                  onType={(t) => setTypes((s) => ({ ...s, score: t }))}
                />
                <section className="dash-card p-4 space-y-3">
                  <h2 className="text-sm font-semibold tracking-tight">Gaps to coach</h2>
                  {p.gaps.length === 0 && (
                    <p className="text-sm text-muted-foreground">No weak axes — keep this pace.</p>
                  )}
                  <ul className="space-y-2">
                    {p.gaps.map((gap: string) => (
                      <li key={gap} className="text-sm leading-5 text-foreground/90 pl-3 border-l-2 border-border">
                        {gap}
                      </li>
                    ))}
                  </ul>
                </section>
                <ChartCard
                  wide
                  kind="time"
                  title="Solved"
                  hint="Resolved and closed by week"
                  data={p.resolvedWeekly}
                  type={types.week}
                  onType={(t) => setTypes((s) => ({ ...s, week: t }))}
                />
                <ChartCard kind="time" title="Intake" hint="Assigned tickets opened" data={p.createdWeekly} type={types.created} onType={(t) => setTypes((s) => ({ ...s, created: t }))} />
                <ChartCard title="Status" hint="Current mix" data={p.byStatus} type={types.status} onType={(t) => setTypes((s) => ({ ...s, status: t }))} />
                <ChartCard title="Category" hint="Work mix" data={p.byCategory} type={types.category} onType={(t) => setTypes((s) => ({ ...s, category: t }))} />
                <ChartCard title="CSAT" hint="Rating distribution" data={p.csatBars} type={types.csat} onType={(t) => setTypes((s) => ({ ...s, csat: t }))} />
                <ChartCard title="SLA" hint="On track vs breached" data={p.sla} type={types.sla} onType={(t) => setTypes((s) => ({ ...s, sla: t }))} />
              </div>
              <section className="dash-card p-4 space-y-3">
                <h2 className="text-sm font-semibold tracking-tight">Completed tickets & feedback</h2>
                {p.completed.length === 0 && <p className="text-sm text-muted-foreground">No resolved tickets yet.</p>}
                <div className="divide-y divide-border/50">
                  {p.completed.map((t: {
                    id: number; ticketNumber: string; title: string; status: string;
                    csatRating?: number | null; csatComment?: string | null; resolvedAt?: string | null;
                  }) => (
                    <Link key={t.id} href={`/tickets/${t.id}`} className="block py-3 hover:text-iris">
                      <div className="flex flex-col app:flex-row app:items-center gap-1">
                        <p className="text-xs font-mono text-muted-foreground w-24">{t.ticketNumber}</p>
                        <p className="text-sm font-medium flex-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t.status.replace(/_/g, ' ')} · {t.csatRating ? `${t.csatRating}/5` : 'No rating'}
                          {t.resolvedAt ? ` · ${formatRelativeTime(t.resolvedAt)}` : ''}
                        </p>
                      </div>
                      {t.csatComment ? (
                        <p className="text-sm text-muted-foreground mt-1 app:pl-24">{t.csatComment}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </RoleGuard>
  );
}

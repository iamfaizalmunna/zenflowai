'use client';

import { useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { ChartCard } from '@/modules/analytics/components/ChartCard';
import { KpiTile } from '@/modules/analytics/components/KpiTile';
import { LeaderboardTable } from '@/modules/analytics/components/LeaderboardTable';
import { FeedbackList } from '@/modules/analytics/components/FeedbackList';
import { ANALYTICS, CUSTOMER_FEEDBACK, LEADERBOARD } from '@/modules/analytics/queries/analytics.queries';
import { parseChartType, type ChartType } from '@/lib/analytics';
import { Select } from '@/components/ui/Select';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const [types, setTypes] = useState<Record<string, ChartType>>({
    volume: 'AREA',
    byStatus: 'DONUT',
    byPriority: 'BAR',
    byCategory: 'DONUT',
    csatTrend: 'BAR',
    sla: 'DONUT',
  });
  const { data, loading } = useQuery(ANALYTICS, { variables: { rangeDays } });
  const { data: board } = useQuery(LEADERBOARD);
  const { data: feedback } = useQuery(CUSTOMER_FEEDBACK);
  const snap = data?.analytics;
  const setType = (id: string, type: ChartType) => setTypes((prev) => ({ ...prev, [id]: type }));

  return (
    <RoleGuard minRole="SUPERVISOR">
        <div className="page-stack">
          <div className="flex flex-col app:flex-row app:items-end justify-between gap-3">
            <PageTitle title="Analytics" hint="Leaderboard, CSAT notes, volume, and mix — find gaps, then coach." />
            <Select
              aria-label="Date range"
              value={String(rangeDays)}
              onValueChange={(value) => setRangeDays(Number(value))}
              className="min-h-10 app:w-40"
              options={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
              ]}
            />
          </div>
          {loading && !snap ? <PageSkeleton /> : (
          <>
          <div className="grid grid-cols-2 app:grid-cols-5 gap-2">
            {snap?.kpis?.map((kpi: { id: string; label: string; value: number }) => (
              <KpiTile key={kpi.id} label={kpi.label} value={kpi.value} />
            ))}
          </div>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight">Solver leaderboard</h2>
            <LeaderboardTable rows={board?.consultantLeaderboard ?? []} />
          </section>
          <div className="grid gap-3 app:grid-cols-2">
            <ChartCard wide kind="time" title="Ticket volume" hint="Created per day" data={snap?.volume ?? []} type={parseChartType(types.volume)} onType={(t) => setType('volume', t)} />
            <ChartCard title="Status mix" hint="Live queue vs done" data={snap?.byStatus ?? []} type={parseChartType(types.byStatus)} onType={(t) => setType('byStatus', t)} />
            <ChartCard title="Priority" hint="Urgency split" data={snap?.byPriority ?? []} type={parseChartType(types.byPriority)} onType={(t) => setType('byPriority', t)} />
            <ChartCard title="Category" hint="Where work lands" data={snap?.byCategory ?? []} type={parseChartType(types.byCategory)} onType={(t) => setType('byCategory', t)} />
            <ChartCard title="CSAT" hint="Submitted scores 1–5" data={snap?.csatTrend ?? []} type={parseChartType(types.csatTrend)} onType={(t) => setType('csatTrend', t)} />
            <ChartCard title="SLA" hint="On track vs breached" data={snap?.sla ?? []} type={parseChartType(types.sla)} onType={(t) => setType('sla', t)} />
          </div>
          <section className="dash-card p-4 space-y-3">
            <h2 className="text-sm font-semibold tracking-tight">Customer feedback</h2>
            <p className="text-xs text-muted-foreground">Ratings and notes on resolved, closed, and still-open work.</p>
            <FeedbackList rows={feedback?.customerFeedback ?? []} />
          </section>
          </>
          )}
        </div>
    </RoleGuard>
  );
}

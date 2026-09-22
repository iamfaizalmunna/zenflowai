'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { ChartCard } from '@/modules/analytics/components/ChartCard';
import { ANALYTICS } from '@/modules/analytics/queries/analytics.queries';
import { parseChartType, type ChartType } from '@/lib/analytics';

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const [types, setTypes] = useState<Record<string, ChartType>>({
    volume: 'AREA',
    byStatus: 'DONUT',
    byPriority: 'BAR',
    byCategory: 'PIE',
    csatTrend: 'BAR',
    sla: 'LINE',
  });
  const { data, loading } = useQuery(ANALYTICS, { variables: { rangeDays } });
  const snap = data?.analytics;

  const setType = (id: string, type: ChartType) => setTypes((prev) => ({ ...prev, [id]: type }));

  return (
    <RoleGuard minRole="SUPERVISOR">
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col app:flex-row app:items-end justify-between gap-3">
            <PageTitle title="Analytics" hint="Volume, SLA, CSAT, and Help drafts in one board." />
            <Select
              aria-label="Date range"
              value={String(rangeDays)}
              onValueChange={(value) => setRangeDays(Number(value))}
              className="app:w-40"
              options={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
              ]}
            />
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <div className="grid grid-cols-2 app:grid-cols-5 gap-3">
            {snap?.kpis?.map((kpi: { id: string; label: string; value: number }) => (
              <div key={kpi.id} className="surface rounded-3xl border border-border p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
                <p className="font-display text-[1.75rem] mt-1 tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 app:grid-cols-2">
            <ChartCard title="Volume" data={snap?.volume ?? []} type={parseChartType(types.volume)} onType={(t) => setType('volume', t)} />
            <ChartCard title="Status" data={snap?.byStatus ?? []} type={parseChartType(types.byStatus)} onType={(t) => setType('byStatus', t)} />
            <ChartCard title="Priority" data={snap?.byPriority ?? []} type={parseChartType(types.byPriority)} onType={(t) => setType('byPriority', t)} />
            <ChartCard title="Category" data={snap?.byCategory ?? []} type={parseChartType(types.byCategory)} onType={(t) => setType('byCategory', t)} />
            <ChartCard title="CSAT mix" data={snap?.csatTrend ?? []} type={parseChartType(types.csatTrend)} onType={(t) => setType('csatTrend', t)} />
            <ChartCard title="SLA" data={snap?.sla ?? []} type={parseChartType(types.sla)} onType={(t) => setType('sla', t)} />
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

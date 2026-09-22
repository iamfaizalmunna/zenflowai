'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { KpiTile } from '@/modules/analytics/components/KpiTile';
import { LeaderboardTable } from '@/modules/analytics/components/LeaderboardTable';
import { CONSULTANTS, LEADERBOARD } from '@/modules/analytics/queries/analytics.queries';
import { formatRelativeTime } from '@/lib/utils';

export default function ConsultantsPage() {
  const { data, loading } = useQuery(CONSULTANTS);
  const { data: board } = useQuery(LEADERBOARD);
  const people = data?.consultants ?? [];
  const resolved = people.reduce((s: number, p: { resolvedCount: number }) => s + p.resolvedCount, 0);
  const csat = people.length
    ? Math.round((people.reduce((s: number, p: { csatAverage: number }) => s + p.csatAverage, 0) / people.length) * 10) / 10
    : 0;
  const index = people.length
    ? Math.round(people.reduce((s: number, p: { assessmentIndex: number }) => s + p.assessmentIndex, 0) / people.length)
    : 0;

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-5">
          <PageTitle title="Consultants" hint="Leaderboard plus profiles. CSAT is customer-only — no peer reviews." />
          <div className="grid grid-cols-2 app:grid-cols-4 gap-2">
            <KpiTile label="Active" value={people.length} />
            <KpiTile label="Solved" value={resolved} />
            <KpiTile label="Avg CSAT" value={csat} />
            <KpiTile label="Avg index" value={index} />
          </div>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight">Solver leaderboard</h2>
            <LeaderboardTable rows={board?.consultantLeaderboard ?? []} />
          </section>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <div className="overflow-x-auto dash-card">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Teams</th>
                  <th className="px-5 py-3.5 font-medium">Open</th>
                  <th className="px-5 py-3.5 font-medium">Solved</th>
                  <th className="px-5 py-3.5 font-medium">CSAT</th>
                  <th className="px-5 py-3.5 font-medium">Index</th>
                  <th className="px-5 py-3.5 font-medium">Last seen</th>
                  <th className="px-5 py-3.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {people.map((p: {
                  id: number; name: string; email: string; teams: string[];
                  openCount: number; resolvedCount: number; csatAverage: number; csatCount: number;
                  assessmentIndex: number;
                  lastLoginAt?: string | null;
                }) => (
                  <tr key={p.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium tracking-tight">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{p.teams.join(', ') || '—'}</td>
                    <td className="px-5 py-4 tabular-nums">{p.openCount}</td>
                    <td className="px-5 py-4 tabular-nums font-medium">{p.resolvedCount}</td>
                    <td className="px-5 py-4 tabular-nums">{p.csatCount ? `${p.csatAverage} (${p.csatCount})` : '—'}</td>
                    <td className="px-5 py-4 tabular-nums font-semibold">{p.assessmentIndex}</td>
                    <td className="px-5 py-4 text-muted-foreground">{p.lastLoginAt ? formatRelativeTime(p.lastLoginAt) : '—'}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/consultants/${p.id}`} className="text-sm font-medium text-iris">Profile</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

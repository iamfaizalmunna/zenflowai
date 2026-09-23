'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { PageTitle } from '@/components/ui/Field';
import { KpiTile } from '@/modules/analytics/components/KpiTile';
import { LeaderboardTable } from '@/modules/analytics/components/LeaderboardTable';
import { CONSULTANTS, LEADERBOARD } from '@/modules/analytics/queries/analytics.queries';
import { filterByQuery } from '@/lib/listSearch';
import { formatRelativeTime } from '@/lib/utils';

type ConsultantRow = {
  id: number;
  name: string;
  email: string;
  teams: string[];
  openCount: number;
  resolvedCount: number;
  csatAverage: number;
  csatCount: number;
  assessmentIndex: number;
  isAiConsultant?: boolean;
  lastLoginAt?: string | null;
};

export default function ConsultantsPage() {
  const [query, setQuery] = useState('');
  const { data, loading } = useQuery(CONSULTANTS);
  const { data: board } = useQuery(LEADERBOARD);
  const people = filterByQuery(
    (data?.consultants ?? []) as ConsultantRow[],
    query,
    (person) => `${person.name} ${person.email} ${person.teams.join(' ')}`,
  );
  const resolved = people.reduce((s, p) => s + p.resolvedCount, 0);
  const csat = people.length
    ? Math.round((people.reduce((s, p) => s + p.csatAverage, 0) / people.length) * 10) / 10
    : 0;
  const index = people.length
    ? Math.round(people.reduce((s, p) => s + p.assessmentIndex, 0) / people.length)
    : 0;

  return (
    <RoleGuard minRole="ADMIN">
        <div className="page-stack">
          <PageTitle title="Consultants" hint="Leaderboard plus profiles. CSAT is customer-only — no peer reviews." />
          <ListSearch value={query} onChange={setQuery} placeholder="Search this 90-day pack…" />
          {loading && !data ? <PageSkeleton /> : (
          <>
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
                {people.map((p) => (
                  <tr key={p.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium tracking-tight">
                        {p.name}
                        {p.isAiConsultant ? ' · AI' : ''}
                      </p>
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
          </>
          )}
        </div>
    </RoleGuard>
  );
}

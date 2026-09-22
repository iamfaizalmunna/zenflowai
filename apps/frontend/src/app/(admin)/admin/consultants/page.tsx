'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { PageTitle } from '@/components/ui/Field';
import { CONSULTANTS } from '@/modules/analytics/queries/analytics.queries';
import { formatRelativeTime } from '@/lib/utils';

export default function ConsultantsPage() {
  const { data, loading } = useQuery(CONSULTANTS);
  const people = data?.consultants ?? [];
  const resolved = people.reduce((s: number, p: { resolvedCount: number }) => s + p.resolvedCount, 0);
  const csat = people.length
    ? Math.round((people.reduce((s: number, p: { csatAverage: number }) => s + p.csatAverage, 0) / people.length) * 10) / 10
    : 0;

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-6">
          <PageTitle title="Consultants" hint="Admin-only progress. Customer CSAT only — no peer reviews." />
          <div className="grid grid-cols-3 gap-4">
            <div className="surface rounded-3xl border border-border p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Active</p>
              <p className="font-display text-[1.75rem] mt-1 tabular-nums">{people.length}</p>
            </div>
            <div className="surface rounded-3xl border border-border p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Resolved</p>
              <p className="font-display text-[1.75rem] mt-1 tabular-nums">{resolved}</p>
            </div>
            <div className="surface rounded-3xl border border-border p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Avg CSAT</p>
              <p className="font-display text-[1.75rem] mt-1 tabular-nums">{csat}</p>
            </div>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && people.length === 0 && (
            <p className="text-sm text-muted-foreground">No agents or supervisors yet.</p>
          )}
          <div className="overflow-x-auto surface rounded-3xl border border-border/70">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Teams</th>
                  <th className="p-4 font-medium">Open</th>
                  <th className="p-4 font-medium">Resolved</th>
                  <th className="p-4 font-medium">CSAT</th>
                  <th className="p-4 font-medium">Last seen</th>
                  <th className="p-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {people.map((p: {
                  id: number; name: string; email: string; teams: string[];
                  openCount: number; resolvedCount: number; csatAverage: number; csatCount: number;
                  lastLoginAt?: string | null;
                }) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="p-4">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.teams.join(', ') || '—'}</td>
                    <td className="p-4">{p.openCount}</td>
                    <td className="p-4">{p.resolvedCount}</td>
                    <td className="p-4">{p.csatCount ? `${p.csatAverage} (${p.csatCount})` : '—'}</td>
                    <td className="p-4 text-muted-foreground">{p.lastLoginAt ? formatRelativeTime(p.lastLoginAt) : '—'}</td>
                    <td className="p-4">
                      <Link href={`/admin/consultants/${p.id}`} className="text-iris text-sm font-medium">View</Link>
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

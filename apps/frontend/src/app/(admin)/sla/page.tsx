'use client';

import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { SLA_POLICIES, UPDATE_SLA } from '@/modules/admin/queries/admin.queries';

export default function AdminSlaPage() {
  const { data, refetch } = useQuery(SLA_POLICIES);
  const [updateSla] = useMutation(UPDATE_SLA, { onCompleted: () => refetch() });

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-4 max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight">SLA policies</h1>
          <p className="text-sm text-slate-500">Hours to first response / full resolution per priority.</p>
          <ul className="space-y-3">
            {data?.slaPolicies?.map((p: { id: number; priority: string; responseTimeHours: number; resolutionTimeHours: number }) => (
              <li key={p.id} className="rounded-xl border p-3 text-sm space-y-2">
                <p className="font-medium">{p.priority}</p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    updateSla({
                      variables: {
                        priority: p.priority,
                        responseTimeHours: Number(fd.get('response')),
                        resolutionTimeHours: Number(fd.get('resolve')),
                      },
                    });
                  }}
                >
                  <input name="response" type="number" step="0.5" min={0} defaultValue={p.responseTimeHours} className="w-24 border rounded-lg px-2 py-1 bg-white dark:bg-slate-900" />
                  <input name="resolve" type="number" step="0.5" min={0} defaultValue={p.resolutionTimeHours} className="w-24 border rounded-lg px-2 py-1 bg-white dark:bg-slate-900" />
                  <button type="submit" className="text-xs underline">Save</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

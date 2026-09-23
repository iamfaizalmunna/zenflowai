'use client';

import { useMutation, useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { SLA_POLICIES, UPDATE_SLA } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle } from '@/components/ui/Field';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function AdminSlaPage() {
  const { data, loading, refetch } = useQuery(SLA_POLICIES);
  const [updateSla] = useMutation(UPDATE_SLA, { onCompleted: () => void refetch() });

  return (
    <RoleGuard minRole="ADMIN">
        <div className="space-y-5 max-w-xl">
          <PageTitle title="SLA policies" hint="Hours to first response / full resolution per priority." />
          {loading && !data ? <PageSkeleton /> : (
          <ul className="space-y-3">
            {data?.slaPolicies?.map((p: { id: number; priority: string; responseTimeHours: number; resolutionTimeHours: number }) => (
              <li key={p.id} className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm space-y-3">
                <p className="font-medium">{p.priority}</p>
                <form
                  className="flex flex-wrap gap-2"
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
                  <Input name="response" type="number" step="0.5" min={0} defaultValue={p.responseTimeHours} className="w-28" aria-label="Response hours" />
                  <Input name="resolve" type="number" step="0.5" min={0} defaultValue={p.resolutionTimeHours} className="w-28" aria-label="Resolution hours" />
                  <Button type="submit" variant="outline">Save</Button>
                </form>
              </li>
            ))}
          </ul>
          )}
        </div>
    </RoleGuard>
  );
}

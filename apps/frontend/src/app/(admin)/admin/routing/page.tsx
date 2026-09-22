'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ROUTING_RULES, SAVE_ROUTING } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';

export default function AdminRoutingPage() {
  const { data, refetch } = useQuery(ROUTING_RULES);
  const [save, { error }] = useMutation(SAVE_ROUTING, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ type: 'KEYWORD', keyword: '', targetTeamId: '', order: '100' });

  return (
    <RoleGuard minRole="SUPERVISOR">
      <AppShell>
        <div className="space-y-5 max-w-3xl">
          <PageTitle title="Routing rules" hint="Keyword, category, priority, then fallback." />
          <form
            className="grid gap-3 sm:grid-cols-2 app:grid-cols-4 rounded-3xl border border-border/70 bg-card/70 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const targetTeamId = Number(form.targetTeamId);
              if (!Number.isInteger(targetTeamId) || targetTeamId <= 0) return;
              save({
                variables: {
                  input: {
                    type: form.type,
                    keyword: form.keyword || null,
                    targetTeamId,
                    order: Number(form.order) || 100,
                    isActive: true,
                  },
                },
              });
            }}
          >
            <Select
              aria-label="Rule type"
              value={form.type}
              onValueChange={(type) => setForm({ ...form, type })}
              options={['KEYWORD', 'CATEGORY', 'PRIORITY', 'FALLBACK'].map((t) => ({ value: t, label: t }))}
            />
            <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Keyword" />
            <Select
              aria-label="Target team"
              value={form.targetTeamId}
              onValueChange={(targetTeamId) => setForm({ ...form, targetTeamId })}
              placeholder="Team"
              options={(data?.teams ?? []).map((t: { id: number; name: string }) => ({ value: String(t.id), label: t.name }))}
            />
            <Button type="submit">Add rule</Button>
          </form>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <ul className="space-y-2 text-sm">
            {data?.routingRules?.map((rule: {
              id: number;
              type: string;
              keyword?: string | null;
              isActive: boolean;
              targetTeamId: number;
              targetTeam?: { name: string };
              order: number;
            }) => (
              <li key={rule.id} className="rounded-2xl border border-border/70 bg-card/70 p-4 flex justify-between gap-3">
                <span>#{rule.order} {rule.type} {rule.keyword ?? ''} → {rule.targetTeam?.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => save({
                    variables: {
                      id: rule.id,
                      input: {
                        type: rule.type,
                        keyword: rule.keyword,
                        targetTeamId: rule.targetTeamId,
                        order: rule.order,
                        isActive: !rule.isActive,
                      },
                    },
                  })}
                >
                  {rule.isActive ? 'Disable' : 'Enable'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

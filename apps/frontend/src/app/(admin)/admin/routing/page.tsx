'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ROUTING_RULES, SAVE_ROUTING } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle } from '@/components/ui/Field';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Select } from '@/components/ui/Select';
import { filterByQuery } from '@/lib/listSearch';

type RoutingRule = {
  id: number;
  type: string;
  keyword?: string | null;
  isActive: boolean;
  targetTeamId: number;
  targetTeam?: { name: string };
  order: number;
};

export default function AdminRoutingPage() {
  const { data, loading, refetch } = useQuery(ROUTING_RULES);
  const [save, { error }] = useMutation(SAVE_ROUTING, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ type: 'KEYWORD', keyword: '', targetTeamId: '', order: '100' });
  const [query, setQuery] = useState('');
  const rules = filterByQuery(
    (data?.routingRules ?? []) as RoutingRule[],
    query,
    (rule) => `${rule.type} ${rule.keyword ?? ''} ${rule.targetTeam?.name ?? ''}`,
  );

  return (
    <RoleGuard minRole="SUPERVISOR">
        <div className="page-stack">
          <PageTitle title="Routing rules" hint="Keyword, category, priority, then fallback." />
          <form
            className="surface-card flex min-w-0 flex-col gap-2 p-4 app:flex-row app:flex-wrap app:items-center"
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
              className="app:w-40"
              value={form.type}
              onValueChange={(type) => setForm({ ...form, type })}
              options={['KEYWORD', 'CATEGORY', 'PRIORITY', 'FALLBACK'].map((t) => ({ value: t, label: t }))}
            />
            <Input className="app:w-48" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Keyword" />
            <Select
              aria-label="Target team"
              className="app:w-44"
              value={form.targetTeamId}
              onValueChange={(targetTeamId) => setForm({ ...form, targetTeamId })}
              placeholder="Team"
              options={(data?.teams ?? []).map((t: { id: number; name: string }) => ({ value: String(t.id), label: t.name }))}
            />
            <Button type="submit" className="app:ml-auto">Add rule</Button>
          </form>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <ListSearch value={query} onChange={setQuery} placeholder="Search this pack…" />
          {loading && !data ? <PageSkeleton /> : (
          <ul className="space-y-2 text-sm">
            {rules.map((rule) => (
              <li key={rule.id} className="surface-card flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm">
                  <span className="font-mono text-[12px] tabular-nums text-iris">#{rule.order}</span>
                  <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{rule.type}</span>
                  {rule.keyword ? <span className="ml-1.5 font-medium">{rule.keyword}</span> : null}
                  <span className="text-muted-foreground"> → {rule.targetTeam?.name}</span>
                </span>
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
          )}
        </div>
    </RoleGuard>
  );
}

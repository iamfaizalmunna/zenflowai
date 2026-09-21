'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ROUTING_RULES, SAVE_ROUTING } from '@/modules/admin/queries/admin.queries';

export default function AdminRoutingPage() {
  const { data, refetch } = useQuery(ROUTING_RULES);
  const [save] = useMutation(SAVE_ROUTING, { onCompleted: () => refetch() });
  const [form, setForm] = useState({ type: 'KEYWORD', keyword: '', targetTeamId: '', order: '100' });

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight">Routing rules</h1>
          <form
            className="grid gap-2 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              save({
                variables: {
                  input: {
                    type: form.type,
                    keyword: form.keyword || null,
                    targetTeamId: Number(form.targetTeamId),
                    order: Number(form.order) || 100,
                    isActive: true,
                  },
                },
              });
            }}
          >
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded-xl px-2 py-2 text-sm bg-white dark:bg-slate-900">
              {['KEYWORD', 'CATEGORY', 'PRIORITY', 'FALLBACK'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="keyword" className="border rounded-xl px-2 py-2 text-sm bg-white dark:bg-slate-900" />
            <select value={form.targetTeamId} onChange={(e) => setForm({ ...form, targetTeamId: e.target.value })} className="border rounded-xl px-2 py-2 text-sm bg-white dark:bg-slate-900" required>
              <option value="">Team…</option>
              {data?.teams?.map((t: { id: number; name: string }) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button type="submit" className="rounded-xl bg-slate-900 text-white text-sm dark:bg-white dark:text-slate-900">Add rule</button>
          </form>
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
              <li key={rule.id} className="rounded-xl border p-3 flex justify-between">
                <span>#{rule.order} {rule.type} {rule.keyword ?? ''} → {rule.targetTeam?.name}</span>
                <button
                  type="button"
                  className="text-xs underline"
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
                </button>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

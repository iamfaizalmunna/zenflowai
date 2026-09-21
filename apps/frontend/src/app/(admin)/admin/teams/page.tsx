'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { SAVE_TEAM, TEAMS } from '@/modules/admin/queries/admin.queries';

export default function AdminTeamsPage() {
  const { data, refetch } = useQuery(TEAMS);
  const [saveTeam] = useMutation(SAVE_TEAM, { onCompleted: () => refetch() });
  const [name, setName] = useState('');

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              saveTeam({ variables: { input: { name } } });
              setName('');
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" className="flex-1 border rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm dark:bg-white dark:text-slate-900">Add</button>
          </form>
          <ul className="space-y-2">
            {data?.teams?.map((team: { id: number; name: string; isDefault: boolean; members?: Array<{ user: { name: string } }> }) => (
              <li key={team.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{team.name}{team.isDefault ? ' · default' : ''}</p>
                <p className="text-xs text-slate-500">{team.members?.map((m) => m.user.name).join(', ') || 'No members'}</p>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

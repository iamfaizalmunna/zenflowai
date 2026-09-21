'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { SAVE_TEAM, TEAMS } from '@/modules/admin/queries/admin.queries';
import { Button, Input, PageTitle } from '@/components/ui/Field';

export default function AdminTeamsPage() {
  const { data, refetch } = useQuery(TEAMS);
  const [saveTeam] = useMutation(SAVE_TEAM, { onCompleted: () => refetch() });
  const [name, setName] = useState('');

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-5 max-w-2xl">
          <PageTitle title="Teams" hint="Who receives routed tickets." />
          <form
            className="flex flex-col app:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              saveTeam({ variables: { input: { name } } });
              setName('');
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" className="flex-1" />
            <Button type="submit">Add</Button>
          </form>
          <ul className="space-y-2">
            {data?.teams?.map((team: { id: number; name: string; isDefault: boolean; members?: Array<{ user: { name: string } }> }) => (
              <li key={team.id} className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm">
                <p className="font-medium">{team.name}{team.isDefault ? ' · default' : ''}</p>
                <p className="text-xs text-muted-foreground mt-1">{team.members?.map((m) => m.user.name).join(', ') || 'No members'}</p>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

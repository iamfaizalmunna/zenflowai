'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADMIN_USERS, BAN_USER, CHANGE_ROLE, SET_USER_ACTIVE, UNBAN_USER } from '@/modules/admin/queries/admin.queries';
import { Button, PageTitle } from '@/components/ui/Field';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Select } from '@/components/ui/Select';
import { filterByQuery } from '@/lib/listSearch';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ADMIN', label: 'Admin' },
];

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const { data, loading, refetch } = useQuery(ADMIN_USERS);
  const [setActive] = useMutation(SET_USER_ACTIVE, { onCompleted: () => refetch() });
  const [ban] = useMutation(BAN_USER, { onCompleted: () => refetch() });
  const [unban] = useMutation(UNBAN_USER, { onCompleted: () => refetch() });
  const [changeRole] = useMutation(CHANGE_ROLE, { onCompleted: () => refetch() });
  const users = filterByQuery(
    (data?.users ?? []) as AdminUser[],
    query,
    (user) => `${user.name} ${user.email} ${user.role}`,
  );

  return (
    <RoleGuard minRole="ADMIN">
        <div className="page-stack">
          <PageTitle title="Users" hint="Roles, access, and account status." />
          <ListSearch value={query} onChange={setQuery} placeholder="Search this pack…" />
          {loading && !data ? <PageSkeleton /> : (
          <div className="overflow-x-auto surface-card">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium w-48">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex min-h-12 items-center px-3 rounded-2xl bg-muted text-xs font-medium">
                          Super Admin
                        </span>
                      ) : (
                        <Select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          onValueChange={(role) => changeRole({ variables: { id: u.id, role } })}
                          options={ROLE_OPTIONS}
                        />
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                        u.isBanned ? 'bg-red-100 text-red-700' : u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                      )}>
                        {u.isBanned ? 'Banned' : u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setActive({ variables: { id: u.id, isActive: !u.isActive } })}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {u.isBanned ? (
                          <Button type="button" variant="ghost" onClick={() => unban({ variables: { id: u.id } })}>Unban</Button>
                        ) : (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => ban({ variables: { id: u.id, reason: 'Admin action' } })}
                          >
                            Ban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
    </RoleGuard>
  );
}

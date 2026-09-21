'use client';

import { useMutation, useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADMIN_USERS, BAN_USER, CHANGE_ROLE, SET_USER_ACTIVE, UNBAN_USER } from '@/modules/admin/queries/admin.queries';

export default function AdminUsersPage() {
  const { data, loading, refetch } = useQuery(ADMIN_USERS);
  const [setActive] = useMutation(SET_USER_ACTIVE, { onCompleted: () => refetch() });
  const [ban] = useMutation(BAN_USER, { onCompleted: () => refetch() });
  const [unban] = useMutation(UNBAN_USER, { onCompleted: () => refetch() });
  const [changeRole] = useMutation(CHANGE_ROLE, { onCompleted: () => refetch() });

  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((u: { id: number; name: string; email: string; role: string; isActive: boolean; isBanned: boolean }) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        disabled={u.role === 'SUPER_ADMIN'}
                        onChange={(e) => changeRole({ variables: { id: u.id, role: e.target.value } })}
                        className="border rounded-lg px-2 py-1 bg-transparent"
                      >
                        {['CUSTOMER', 'AGENT', 'SUPERVISOR'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">{u.isBanned ? 'Banned' : u.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="p-3 space-x-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => setActive({ variables: { id: u.id, isActive: !u.isActive } })}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.isBanned ? (
                        <button type="button" className="text-xs underline" onClick={() => unban({ variables: { id: u.id } })}>Unban</button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => ban({ variables: { id: u.id, reason: 'Admin action' } })}
                        >
                          Ban
                        </button>
                      )}
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

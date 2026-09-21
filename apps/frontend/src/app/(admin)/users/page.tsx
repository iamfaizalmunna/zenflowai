'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';

export default function AdminUsersPage() {
  return (
    <RoleGuard minRole="ADMIN">
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users & Teams</h1>
          <p className="text-slate-500 mt-1 text-sm">Full user management coming in Phase 4 ✦</p>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';

export default function AgentQueuePage() {
  return (
    <RoleGuard minRole="AGENT">
      <AppShell>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ticket Queue</h1>
          <p className="text-slate-500 mt-1 text-sm">Full queue view coming in Phase 2 ✦</p>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

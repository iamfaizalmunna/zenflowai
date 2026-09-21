'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { useAuthStore } from '@/store/auth.store';

// Phase 1: placeholder — full dashboard built in Phase 2
export default function CustomerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Here&apos;s what&apos;s happening with your tickets.
            </p>
          </div>

          {/* Phase 2: replace with real ticket stats + list */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Open',     value: '—', color: 'text-blue-600' },
              { label: 'Waiting',  value: '—', color: 'text-amber-600' },
              { label: 'Resolved', value: '—', color: 'text-emerald-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-400 text-center py-8">
              Ticket list coming in Phase 2 ✦
            </p>
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}

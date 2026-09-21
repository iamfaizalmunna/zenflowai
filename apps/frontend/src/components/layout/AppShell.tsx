'use client';

// Shared shell for all authenticated routes
// Sidebar + main content area
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

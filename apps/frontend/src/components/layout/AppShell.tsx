'use client';

import { Sidebar } from './Sidebar';
import { MobileChrome } from './MobileChrome';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden overflow-x-hidden bg-mesh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileChrome />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-28 [scrollbar-gutter:stable] app:pb-0">
          <div className="w-full min-w-0 max-w-full px-4 py-5 app:px-8 app:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

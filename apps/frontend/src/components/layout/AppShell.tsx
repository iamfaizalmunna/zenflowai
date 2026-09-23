'use client';

import { Sidebar } from './Sidebar';
import { MobileChrome } from './MobileChrome';
import { useAppearance } from '@/hooks/useAppearance';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { prefs } = useAppearance();
  return (
    <div className="flex h-[100dvh] overflow-hidden overflow-x-hidden bg-mesh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileChrome />
        <main className="flex-1 overflow-y-auto min-w-0 pb-28 app:pb-0">
          <div className={cn('max-w-7xl mx-auto w-full min-w-0', prefs.density === 'COMPACT' ? 'p-3 app:p-5' : 'px-4 py-4 app:px-8 app:py-7')}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

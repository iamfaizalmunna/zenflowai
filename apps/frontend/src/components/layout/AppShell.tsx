'use client';

import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileChrome } from './MobileChrome';
import { useAppearance } from '@/hooks/useAppearance';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { prefs } = useAppearance();
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-mesh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileChrome />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 overflow-y-auto pb-28 app:pb-0"
        >
          <div className={cn('max-w-7xl mx-auto w-full', prefs.density === 'COMPACT' ? 'p-3.5 app:p-5' : 'px-4 py-5 app:px-8 app:py-7')}>
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}

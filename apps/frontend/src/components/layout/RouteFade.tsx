'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTE_FADE_CLASS } from '@/lib/uiPerf';

export function RouteFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={ROUTE_FADE_CLASS}>
      {children}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { isNavActive, navForRole, splitMobileNav, type AppNavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { ZenLogo } from '@/components/brand/ZenLogo';
import { NAV_ICONS } from '@/components/layout/navIcons';
import { MoreSheet } from '@/components/layout/MoreSheet';
import { useUiSound } from '@/hooks/useUiSound';

export function MobileChrome() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const { play } = useUiSound();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navForRole(user?.role);
  const { primary, overflow } = splitMobileNav(items);

  return (
    <>
      <header className="app:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <ZenLogo size={28} className="[&>span]:text-base" />
        <Link href="/settings" className="p-2 min-h-11 min-w-11 rounded-xl text-muted-foreground" aria-label="Appearance settings">
          <Settings2 className="w-4 h-4 mx-auto" />
        </Link>
      </header>

      <nav className="app:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/88 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <ul
          className="grid px-1"
          style={{ gridTemplateColumns: `repeat(${primary.length + (overflow.length > 0 ? 1 : 0)}, minmax(0, 1fr))` }}
        >
          {primary.map((item) => (
            <MobileTab key={item.href} item={item} pathname={pathname} onTap={() => void play('tap')} />
          ))}
          {overflow.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => {
                  void play('tap');
                  setMoreOpen(true);
                }}
                className={cn(
                  'w-full flex flex-col items-center gap-0.5 py-2.5 min-h-14 text-[10px]',
                  moreOpen ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                <MoreHorizontal className="w-5 h-5" />
                More
              </button>
            </li>
          )}
        </ul>
      </nav>

      <MoreSheet
        open={moreOpen}
        items={overflow}
        onClose={() => setMoreOpen(false)}
        onLogout={() => void logout()}
        onTap={() => void play('tap')}
      />
    </>
  );
}

function MobileTab({
  item,
  pathname,
  onTap,
}: {
  item: AppNavItem;
  pathname: string;
  onTap: () => void;
}) {
  const Icon = NAV_ICONS[item.icon];
  const active = isNavActive(pathname, item.href);
  return (
    <li>
      <Link
        href={item.href}
        onClick={onTap}
        className={cn(
          'flex flex-col items-center gap-0.5 py-2.5 min-h-14 text-[10px]',
          active ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
      >
        <Icon className="w-5 h-5" />
        {item.label}
      </Link>
    </li>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { LogOut, Moon, MoreHorizontal, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { isNavActive, navForRole, splitMobileNav, type AppNavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { ZenLogo } from '@/components/brand/ZenLogo';
import { NAV_ICONS } from '@/components/layout/navIcons';
import { useUiSound } from '@/hooks/useUiSound';

export function MobileChrome() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();
  const { play, muted, setMuted } = useUiSound();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navForRole(user?.role);
  const { primary, overflow } = splitMobileNav(items);
  const current = items.find((item) => isNavActive(pathname, item.href));

  return (
    <>
      <header className="app:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 border-b border-white/10 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <ZenLogo size={28} className="[&>span]:text-base" />
        <p className="text-xs text-muted-foreground truncate max-w-[40%]">{current?.label ?? 'ZenFlow'}</p>
      </header>

      <nav className="app:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-card/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
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
                className="w-full flex flex-col items-center gap-0.5 py-2.5 min-h-14 text-[10px] text-muted-foreground"
              >
                <MoreHorizontal className="w-5 h-5" />
                More
              </button>
            </li>
          )}
        </ul>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="app:hidden fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-display text-lg">More</p>
                <button type="button" onClick={() => setMoreOpen(false)} className="p-2 min-h-11 min-w-11">
                  <X className="w-4 h-4 mx-auto" />
                </button>
              </div>
              {overflow.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      void play('tap');
                      setMoreOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl min-h-12 hover:bg-muted"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button type="button" onClick={() => setMuted(!muted)} className="flex w-full items-center gap-3 px-3 py-3 rounded-2xl min-h-12">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {muted ? 'Sounds off' : 'Sounds on'}
              </button>
              <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-3 px-3 py-3 rounded-2xl min-h-12">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 px-3 py-3 rounded-2xl min-h-12 text-destructive">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          active ? 'text-iris font-medium' : 'text-muted-foreground',
        )}
      >
        <Icon className="w-5 h-5" />
        {item.label}
      </Link>
    </li>
  );
}

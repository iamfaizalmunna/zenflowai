'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Moon, Settings2, Sun, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { ROLE_COLOR, ROLE_LABEL } from '@/lib/constants';
import { isNavActive, navForRole } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { isDarkColorMode, toggledColorMode } from '@/lib/appearance';
import { ZenLogo } from '@/components/brand/ZenLogo';
import { NAV_ICONS } from '@/components/layout/navIcons';
import { useUiSound } from '@/hooks/useUiSound';
import { useAppearance } from '@/hooks/useAppearance';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const { play } = useUiSound();
  const { prefs, update } = useAppearance();
  const role = user?.role ?? 'CUSTOMER';
  const navItems = navForRole(role);
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = isDarkColorMode(prefs.colorMode, prefersDark);

  return (
    <aside className="hidden app:flex w-60 flex-col h-full border-r border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="h-16 flex items-center px-4 border-b border-border/60">
        <ZenLogo size={32} />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => void play('tap')}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors min-h-10',
                active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-muted"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/60 space-y-1">
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground min-h-11"
        >
          <Settings2 className="w-4 h-4" />
          Appearance
        </Link>
        <button
          type="button"
          onClick={() => update({ soundsMuted: !prefs.soundsMuted })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground min-h-11"
        >
          {prefs.soundsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {prefs.soundsMuted ? 'Sounds off' : 'Sounds on'}
        </button>
        <button
          type="button"
          onClick={() => {
            const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            update({ colorMode: toggledColorMode(prefs.colorMode, osDark) });
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground min-h-11"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? 'Light' : 'Dark'}
        </button>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-iris/20 text-iris flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className={cn('text-[10px] px-1.5 py-0.5 rounded-full w-fit mt-0.5', ROLE_COLOR[role])}>
              {ROLE_LABEL[role]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive min-h-11 min-w-11"
          >
            <LogOut className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </aside>
  );
}

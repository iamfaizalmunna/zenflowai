'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { ROLE_COLOR, ROLE_LABEL } from '@/lib/constants';
import { isNavActive, navForRole } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { ZenLogo } from '@/components/brand/ZenLogo';
import { NAV_ICONS } from '@/components/layout/navIcons';
import { useUiSound } from '@/hooks/useUiSound';

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const { play, muted, setMuted } = useUiSound();
  const role = user?.role ?? 'CUSTOMER';
  const navItems = navForRole(role);

  return (
    <aside className="hidden app:flex w-60 flex-col h-full border-r border-white/10 bg-card/80 backdrop-blur-xl">
      <div className="h-16 flex items-center px-4 border-b border-white/10">
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
              onMouseEnter={() => void play('hover')}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors min-h-11',
                active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl bg-iris/15 ring-1 ring-iris/30"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground min-h-11"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {muted ? 'Sounds off' : 'Sounds on'}
        </button>
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground min-h-11"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
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

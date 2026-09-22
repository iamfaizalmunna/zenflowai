'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, Moon, Settings2, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { isNavActive, type AppNavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { NAV_ICONS } from '@/components/layout/navIcons';
import { isDarkColorMode, toggledColorMode } from '@/lib/appearance';
import { useAppearance } from '@/hooks/useAppearance';

export function MoreSheet({
  open,
  items,
  onClose,
  onLogout,
  onTap,
}: {
  open: boolean;
  items: AppNavItem[];
  onClose: () => void;
  onLogout: () => void;
  onTap: () => void;
}) {
  const pathname = usePathname();
  const { prefs, update } = useAppearance();
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = isDarkColorMode(prefs.colorMode, prefersDark);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="app:hidden fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="More"
            initial={{ y: 28, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.12, duration: 0.42 }}
            className="absolute bottom-0 inset-x-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border-t border-border/70 bg-background/92 backdrop-blur-2xl px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-30px_80px_hsl(var(--foreground)/0.12)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" />
            <div className="flex items-center justify-between px-1 mb-4">
              <div>
                <p className="font-display text-xl tracking-tight">More</p>
                <p className="text-xs text-muted-foreground">Workspace and preferences</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <p className="px-1 mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
            <div className="rounded-3xl border border-border/60 bg-card/80 overflow-hidden mb-4">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      onTap();
                      onClose();
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3.5 min-h-12 border-b border-border/50 last:border-0',
                      active ? 'bg-iris/10 text-foreground' : 'text-foreground/90',
                    )}
                  >
                    <span className={cn('h-8 w-8 rounded-2xl grid place-items-center', active ? 'bg-iris/20 text-iris' : 'bg-muted text-muted-foreground')}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                  </Link>
                );
              })}
            </div>

            <p className="px-1 mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Preferences</p>
            <div className="rounded-3xl border border-border/60 bg-card/80 overflow-hidden mb-4">
              <Link
                href="/settings"
                onClick={() => {
                  onTap();
                  onClose();
                }}
                className="flex items-center gap-3 px-3.5 min-h-12 border-b border-border/50"
              >
                <span className="h-8 w-8 rounded-2xl grid place-items-center bg-muted text-muted-foreground">
                  <Settings2 className="w-4 h-4" />
                </span>
                <span className="flex-1 text-sm font-medium">Appearance</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
              </Link>
              <button
                type="button"
                onClick={() => update({ soundsMuted: !prefs.soundsMuted })}
                className="flex w-full items-center gap-3 px-3.5 min-h-12 border-b border-border/50"
              >
                <span className="h-8 w-8 rounded-2xl grid place-items-center bg-muted text-muted-foreground">
                  {prefs.soundsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </span>
                <span className="flex-1 text-sm font-medium text-left">{prefs.soundsMuted ? 'Sounds off' : 'Sounds on'}</span>
                <span className={cn('h-6 w-10 rounded-full p-0.5 transition-colors', prefs.soundsMuted ? 'bg-muted' : 'bg-iris')}>
                  <span className={cn('block h-5 w-5 rounded-full bg-background shadow-sm transition-transform', prefs.soundsMuted ? 'translate-x-0' : 'translate-x-4')} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  update({ colorMode: toggledColorMode(prefs.colorMode, osDark) });
                }}
                className="flex w-full items-center gap-3 px-3.5 min-h-12"
              >
                <span className="h-8 w-8 rounded-2xl grid place-items-center bg-muted text-muted-foreground">
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </span>
                <span className="flex-1 text-sm font-medium text-left">{dark ? 'Light mode' : 'Dark mode'}</span>
                <span className={cn('h-6 w-10 rounded-full p-0.5 transition-colors', dark ? 'bg-iris' : 'bg-muted')}>
                  <span className={cn('block h-5 w-5 rounded-full bg-background shadow-sm transition-transform', dark ? 'translate-x-4' : 'translate-x-0')} />
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex w-full items-center justify-center gap-2 min-h-12 rounded-3xl border border-border/60 bg-card/80 text-sm font-medium text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

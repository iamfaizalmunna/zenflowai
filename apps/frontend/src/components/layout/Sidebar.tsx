'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Ticket, LayoutDashboard, Users, Settings, LogOut,
  Zap, Bookmark, Code2, BarChart2, ShieldCheck,
  Inbox, BookOpen, Moon, Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { ROLE_LABEL, ROLE_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Navigation items per role — each role sees only what it needs
const NAV_BY_ROLE: Record<string, Array<{ href: string; label: string; icon: React.ElementType }>> = {
  CUSTOMER: [
    { href: '/dashboard',       label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/tickets',         label: 'My Tickets', icon: Ticket },
    { href: '/tickets/new',     label: 'New Ticket', icon: Ticket },
    { href: '/knowledge',       label: 'Help Center',icon: BookOpen },
  ],
  AGENT: [
    { href: '/queue',           label: 'Queue',      icon: Inbox },
    { href: '/knowledge/internal', label: 'Guides', icon: BookOpen },
  ],
  SUPERVISOR: [
    { href: '/queue',           label: 'Queue',      icon: Inbox },
    { href: '/supervisor',      label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/analytics',       label: 'Analytics',  icon: BarChart2 },
    { href: '/knowledge/internal', label: 'Guides', icon: BookOpen },
  ],
  ADMIN: [
    { href: '/admin/users',     label: 'Users',      icon: Users },
    { href: '/admin/teams',     label: 'Teams',      icon: Users },
    { href: '/admin/routing',   label: 'Routing',    icon: Settings },
    { href: '/admin/sla',       label: 'SLA',        icon: Settings },
    { href: '/admin/knowledge', label: 'Knowledge',  icon: BookOpen },
    { href: '/admin/security',  label: 'Security',   icon: ShieldCheck },
    { href: '/analytics',       label: 'Analytics',  icon: BarChart2 },
  ],
  SUPER_ADMIN: [
    { href: '/admin/users',     label: 'Users',      icon: Users },
    { href: '/admin/teams',     label: 'Teams',      icon: Users },
    { href: '/admin/routing',   label: 'Routing',    icon: Settings },
    { href: '/admin/sla',       label: 'SLA',        icon: Settings },
    { href: '/admin/knowledge', label: 'Knowledge',  icon: BookOpen },
    { href: '/admin/security',  label: 'Security',   icon: ShieldCheck },
    { href: '/analytics',       label: 'Analytics',  icon: BarChart2 },
    { href: '/superpowers',     label: 'Superpowers',icon: Code2 },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const { logout } = useLogout();

  const role = user?.role ?? 'CUSTOMER';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.CUSTOMER;

  return (
    <aside className="w-56 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white dark:text-slate-900" />
        </div>
        <span className="text-sm font-bold tracking-tight">ZenFlowAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon    = item.icon;
          const active  = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'text-slate-900 dark:text-white font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              )}>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-slate-100 dark:bg-slate-800"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10 flex-shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {/* User + logout */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className={cn('text-xs px-1 rounded w-fit mt-0.5', ROLE_COLOR[role])}>
              {ROLE_LABEL[role]}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

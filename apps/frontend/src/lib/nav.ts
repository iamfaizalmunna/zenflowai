export const MOBILE_MAX_PX = 1024;
export const DESKTOP_MIN_PX = 1025;
export const MOBILE_PRIMARY_COUNT = 4;

export type AppNavIcon =
  | 'dashboard'
  | 'ticket'
  | 'plus'
  | 'book'
  | 'inbox'
  | 'users'
  | 'settings'
  | 'chart'
  | 'shield'
  | 'timer'
  | 'route'
  | 'usercog';

export interface AppNavItem {
  href: string;
  label: string;
  icon: AppNavIcon;
}

export const NAV_BY_ROLE: Record<string, AppNavItem[]> = {
  CUSTOMER: [
    { href: '/dashboard', label: 'Home', icon: 'dashboard' },
    { href: '/tickets', label: 'Tickets', icon: 'ticket' },
    { href: '/tickets/new', label: 'New', icon: 'plus' },
    { href: '/knowledge', label: 'Help', icon: 'book' },
  ],
  AGENT: [
    { href: '/queue', label: 'Queue', icon: 'inbox' },
    { href: '/knowledge/internal', label: 'Guides', icon: 'book' },
  ],
  SUPERVISOR: [
    { href: '/queue', label: 'Queue', icon: 'inbox' },
    { href: '/supervisor', label: 'Watch', icon: 'dashboard' },
    { href: '/analytics', label: 'Analytics', icon: 'chart' },
    { href: '/knowledge/internal', label: 'Guides', icon: 'book' },
    { href: '/admin/routing', label: 'Routing', icon: 'route' },
  ],
  ADMIN: [
    { href: '/analytics', label: 'Analytics', icon: 'chart' },
    { href: '/admin/consultants', label: 'Consultants', icon: 'users' },
    { href: '/admin/users', label: 'Users', icon: 'usercog' },
    { href: '/admin/security', label: 'Security', icon: 'shield' },
    { href: '/admin/teams', label: 'Teams', icon: 'users' },
    { href: '/admin/routing', label: 'Routing', icon: 'route' },
    { href: '/admin/sla', label: 'SLA', icon: 'timer' },
    { href: '/admin/knowledge', label: 'Knowledge', icon: 'book' },
  ],
  SUPER_ADMIN: [
    { href: '/analytics', label: 'Analytics', icon: 'chart' },
    { href: '/admin/consultants', label: 'Consultants', icon: 'users' },
    { href: '/admin/users', label: 'Users', icon: 'usercog' },
    { href: '/admin/security', label: 'Security', icon: 'shield' },
    { href: '/admin/teams', label: 'Teams', icon: 'users' },
    { href: '/admin/routing', label: 'Routing', icon: 'route' },
    { href: '/admin/sla', label: 'SLA', icon: 'timer' },
    { href: '/admin/knowledge', label: 'Knowledge', icon: 'book' },
  ],
};

export function navForRole(role: string | undefined): AppNavItem[] {
  return NAV_BY_ROLE[role ?? ''] ?? NAV_BY_ROLE.CUSTOMER;
}

/** Bottom tabs: keep 4 slots. If more items exist, last slot is reserved for More. */
export function splitMobileNav(
  items: AppNavItem[],
  primaryCount = MOBILE_PRIMARY_COUNT,
): { primary: AppNavItem[]; overflow: AppNavItem[] } {
  if (items.length <= primaryCount) {
    return { primary: items, overflow: [] };
  }
  return {
    primary: items.slice(0, primaryCount - 1),
    overflow: items.slice(primaryCount - 1),
  };
}

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/tickets') {
    return /^\/tickets\/\d+/.test(pathname);
  }
  if (href === '/knowledge') {
    return pathname.startsWith('/knowledge/') && !pathname.startsWith('/knowledge/internal');
  }
  return pathname.startsWith(`${href}/`);
}

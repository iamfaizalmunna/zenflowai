import { ROLE_HIERARCHY, ROLE_HOME } from './constants';
import { navForRole } from './nav';

export const E2E_GRAPHQL_STEPS = [
  'login',
  'me',
  'tickets',
  'myNotifications',
  'knowledgeArticles',
  'slaPolicies',
  'consultants',
] as const;

export function screensForRole(role: string): string[] {
  const nav = navForRole(role).map((item) => item.href);
  const home = ROLE_HOME[role];
  const extra = home && !nav.includes(home) ? [home] : [];
  return [...new Set([...extra, ...nav, '/settings'])];
}

export function canRoleOpenPath(role: string, href: string): boolean {
  if (href === '/login' || href === '/register' || href === '/settings') return true;
  if (href === '/qa' || href.startsWith('/qa/')) return true;
  if (screensForRole(role).includes(href)) return true;
  if (href.startsWith('/admin/') && (ROLE_HIERARCHY[role] ?? -1) >= ROLE_HIERARCHY.ADMIN) return true;
  if (href === '/admin/routing' && role === 'SUPERVISOR') return true;
  return false;
}

export function customerBlockedAdminPaths(): string[] {
  return ['/admin/users', '/admin/security', '/admin/consultants', '/admin/sla'];
}

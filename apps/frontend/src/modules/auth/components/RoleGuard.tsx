'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_HOME, meetsMinRole } from '@/lib/constants';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Minimum role required to access this route */
  minRole?: string;
  /** Redirect if not authenticated */
  requireAuth?: boolean;
}

export function RoleGuard({ children, minRole, requireAuth = true }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const denied = Boolean(minRole && user && !meetsMinRole(user.role, minRole));

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (denied && user) {
      router.replace(ROLE_HOME[user.role] ?? '/login');
    }
  }, [isAuthenticated, user, denied, requireAuth, router]);

  if (requireAuth && !isAuthenticated) return null;
  if (minRole && !user) return null;
  if (denied) return null;
  return <>{children}</>;
}

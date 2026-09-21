'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_HOME, ROLE_HIERARCHY } from '@/lib/constants';

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

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (minRole && user) {
      const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
      const required  = ROLE_HIERARCHY[minRole] ?? 0;
      if (userLevel < required) {
        // Redirect to their own home instead of showing 403
        router.replace(ROLE_HOME[user.role] ?? '/login');
      }
    }
  }, [isAuthenticated, user, minRole, requireAuth, router]);

  if (requireAuth && !isAuthenticated) return null;
  return <>{children}</>;
}

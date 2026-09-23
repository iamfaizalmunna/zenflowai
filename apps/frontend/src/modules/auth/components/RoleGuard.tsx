'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_HOME, meetsMinRole } from '@/lib/constants';

interface RoleGuardProps {
  children: ReactNode;
  minRole?: string;
  requireAuth?: boolean;
}

function subscribeHydration(onStoreChange: () => void): () => void {
  return useAuthStore.persist.onFinishHydration(onStoreChange);
}

export function RoleGuard({ children, minRole, requireAuth = true }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
  const denied = Boolean(minRole && user && !meetsMinRole(user.role, minRole));

  useEffect(() => {
    if (!hydrated) return;
    if (requireAuth && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (denied && user) {
      router.replace(ROLE_HOME[user.role] ?? '/login');
    }
  }, [hydrated, isAuthenticated, user, denied, requireAuth, router]);

  if (!hydrated) return <>{children}</>;
  if (requireAuth && !isAuthenticated) return null;
  if (minRole && !user) return null;
  if (denied) return null;
  return <>{children}</>;
}

import { AppShell } from '@/components/layout/AppShell';
import { RouteFade } from '@/components/layout/RouteFade';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <RouteFade>{children}</RouteFade>
    </AppShell>
  );
}

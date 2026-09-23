'use client';

import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { TicketWorkspace } from '@/modules/tickets/components/TicketWorkspace';
import { useAuthStore } from '@/store/auth.store';
import { useParams } from 'next/navigation';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const role = useAuthStore((s) => s.user?.role);

  return (
    <RoleGuard minRole="CUSTOMER">
        <TicketWorkspace id={id} role={role} />
    </RoleGuard>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { Button, Input, PageTitle } from '@/components/ui/Field';
import { ListSearch } from '@/components/ui/ListSearch';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import {
  AUDIT_LOGS,
  BLOCKED_IPS,
  BLOCK_IP,
  REVIEW_SPAM,
  SPAM_REPORTS,
  UNBLOCK_IP,
} from '@/modules/analytics/queries/analytics.queries';
import { formatRelativeTime } from '@/lib/utils';
import { filterByQuery } from '@/lib/listSearch';

type AuditRow = { id: number; action: string; message: string; createdAt: string };

export default function SecurityPage() {
  const { data: audits, loading } = useQuery(AUDIT_LOGS);
  const { data: ips, refetch: refetchIps } = useQuery(BLOCKED_IPS);
  const { data: spam, refetch: refetchSpam } = useQuery(SPAM_REPORTS);
  const [block] = useMutation(BLOCK_IP, { onCompleted: () => refetchIps() });
  const [unblock] = useMutation(UNBLOCK_IP, { onCompleted: () => refetchIps() });
  const [review] = useMutation(REVIEW_SPAM, { onCompleted: () => refetchSpam() });
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('manual block');
  const [query, setQuery] = useState('');
  const auditRows = filterByQuery(
    (audits?.auditLogs?.rows ?? []) as AuditRow[],
    query,
    (row) => `${row.action} ${row.message}`,
  );

  return (
    <RoleGuard minRole="ADMIN">
        <div className="space-y-6">
          <PageTitle title="Security" hint="Audit, blocked IPs, and spam queue. Heuristics stay local." />
          <section className="surface rounded-3xl border border-border/70 p-4 space-y-3">
            <h2 className="font-display text-lg">Block an IP</h2>
            <form
              className="flex flex-col app:flex-row gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ip.trim()) return;
                void block({ variables: { ip: ip.trim(), reason } });
                setIp('');
              }}
            >
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.10" />
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
              <Button type="submit">Block</Button>
            </form>
            <ul className="space-y-2">
              {ips?.blockedIps?.map((row: { id: number; ip: string; reason: string }) => (
                <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                  <span><span className="font-mono">{row.ip}</span> · {row.reason}</span>
                  <Button type="button" variant="ghost" onClick={() => void unblock({ variables: { id: row.id } })}>Unblock</Button>
                </li>
              ))}
            </ul>
          </section>
          <section className="surface rounded-3xl border border-border/70 p-4 space-y-3">
            <h2 className="font-display text-lg">Spam queue</h2>
            {(spam?.spamReports as { id: number; targetType: string; targetId: number; status: string; reason: string }[] | undefined)?.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 px-3 py-2 text-sm">
                <p>{row.targetType} #{row.targetId} · {row.reason} · {row.status}</p>
                {row.status === 'PENDING' && (
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" onClick={() => void review({ variables: { id: row.id, status: 'CONFIRMED' } })}>Confirm</Button>
                    <Button type="button" variant="ghost" onClick={() => void review({ variables: { id: row.id, status: 'DISMISSED' } })}>Dismiss</Button>
                  </div>
                )}
              </div>
            ))}
          </section>
          <section className="surface rounded-3xl border border-border/70 p-4 space-y-2">
            <h2 className="font-display text-lg">Audit log</h2>
            <ListSearch value={query} onChange={setQuery} placeholder="Search this pack…" />
            {loading && !audits ? <PageSkeleton /> : auditRows.map((row) => (
              <p key={row.id} className="text-xs border-b border-border/40 py-2">
                <span className="font-medium">{row.action}</span> · {row.message} · {formatRelativeTime(row.createdAt)}
              </p>
            ))}
          </section>
        </div>
    </RoleGuard>
  );
}

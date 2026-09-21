'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';
import { ADD_MESSAGE, GET_TICKET, UPDATE_TICKET } from '@/modules/tickets/queries/ticket.queries';
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const role = useAuthStore((s) => s.user?.role);
  const isStaff = STAFF.has(role ?? '');
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TICKET, { variables: { id }, skip: !id });
  const [addMessage, { loading: sending }] = useMutation(ADD_MESSAGE, {
    onCompleted: () => { setBody(''); refetch(); },
  });
  const [updateTicket] = useMutation(UPDATE_TICKET, { onCompleted: () => refetch() });

  const ticket = data?.ticket;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addMessage({
      variables: {
        input: { ticketId: id, body, type: internal ? 'INTERNAL_NOTE' : 'REPLY' },
      },
    });
  };

  return (
    <RoleGuard minRole="CUSTOMER">
      <AppShell>
        {loading && <p className="text-sm text-slate-400">Loading ticket…</p>}
        {ticket && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <p className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</p>
              <h1 className="text-2xl font-bold tracking-tight mt-1">{ticket.title}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[ticket.status])}>
                  {STATUS_LABEL[ticket.status]}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLOR[ticket.priority])}>
                  {PRIORITY_LABEL[ticket.priority]}
                </span>
                {ticket.team && <span className="text-xs text-slate-500">Team: {ticket.team.name}</span>}
                {ticket.assignedTo && <span className="text-xs text-slate-500">Agent: {ticket.assignedTo.name}</span>}
              </div>
            </div>

            {isStaff && (
              <div className="flex gap-2">
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicket({ variables: { id, input: { status: e.target.value } } })}
                  className="text-sm border rounded-xl px-3 py-2 bg-white dark:bg-slate-900"
                >
                  {['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              {ticket.messages?.map((msg: { id: number; body: string; type: string; createdAt: string; sender: { name: string } }) => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-xl border p-3 text-sm',
                    msg.type === 'INTERNAL_NOTE'
                      ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  )}
                >
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{msg.sender.name}{msg.type === 'INTERNAL_NOTE' ? ' · internal' : ''}</span>
                    <span>{formatRelativeTime(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={send} className="space-y-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Write a reply…"
                className="w-full border rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
              />
              {isStaff && (
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
              )}
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}

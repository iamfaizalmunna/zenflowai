'use client';

import Link from 'next/link';
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TicketView } from '@/lib/appearance';

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  title: string;
  slaResolutionDueAt?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string | null;
  assignedTo?: { name: string } | null;
  category?: { name: string; color: string } | null;
}

function Badges({ ticket }: { ticket: TicketListItem }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[ticket.status])}>
        {STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLOR[ticket.priority])}>
        {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
      </span>
      {ticket.category && (
        <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: ticket.category.color }}>
          {ticket.category.name}
        </span>
      )}
    </div>
  );
}

export function TicketCard({
  ticket,
  href,
  view = 'LIST',
}: {
  ticket: TicketListItem;
  href: string;
  view?: TicketView;
}) {
  if (view === 'ICON') {
    return (
      <Link href={href} className="block h-full">
        <article className="surface h-full rounded-2xl border border-border/60 p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-iris/15 text-iris font-display text-lg">
            {ticket.ticketNumber.replace('#ZEN-', '').slice(-2)}
          </span>
          <p className="text-[10px] font-mono text-muted-foreground">{ticket.ticketNumber}</p>
          <h3 className="text-xs font-medium line-clamp-2">{ticket.title}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', STATUS_COLOR[ticket.status])}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </article>
      </Link>
    );
  }

  if (view === 'COMPACT') {
    return (
      <Link href={href} className="block">
        <article className="surface rounded-xl border border-border/60 px-3 py-2 flex items-center gap-3 hover:border-iris/30 transition-colors">
          <p className="text-[11px] font-mono text-muted-foreground shrink-0 w-24">{ticket.ticketNumber}</p>
          <h3 className="text-sm font-medium truncate flex-1">{ticket.title}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0', STATUS_COLOR[ticket.status])}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </article>
      </Link>
    );
  }

  if (view === 'CARD') {
    return (
      <Link href={href} className="block h-full">
        <article className="surface h-full rounded-3xl border border-border/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <p className="text-xs font-mono text-iris">{ticket.ticketNumber}</p>
          <h3 className="font-display text-lg tracking-tight mt-2 line-clamp-2">{ticket.title}</h3>
          <p className="text-xs text-muted-foreground mt-2">{formatRelativeTime(ticket.createdAt)}</p>
          <div className="mt-4">
            <Badges ticket={ticket} />
          </div>
          {ticket.assignedTo && (
            <p className="text-xs text-muted-foreground mt-3">Assigned {ticket.assignedTo.name}</p>
          )}
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <article className="surface rounded-2xl border border-border/60 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</p>
            <h3 className="font-medium text-sm mt-0.5 truncate">{ticket.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(ticket.createdAt)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badges ticket={ticket} />
          {ticket.assignedTo && (
            <span className="text-xs text-muted-foreground">Assigned: {ticket.assignedTo.name}</span>
          )}
        </div>
      </article>
    </Link>
  );
}

export function ticketGridClass(view: TicketView): string {
  if (view === 'ICON') return 'grid gap-3 grid-cols-2 app:grid-cols-4';
  if (view === 'CARD') return 'grid gap-3 grid-cols-1 app:grid-cols-2';
  return 'space-y-2';
}

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
  assignedTo?: { name: string; isAiConsultant?: boolean | null } | null;
  category?: { name: string; color: string } | null;
}

function Badges({ ticket }: { ticket: TicketListItem }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLOR[ticket.status])}>
        {STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', PRIORITY_COLOR[ticket.priority])}>
        {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
      </span>
      {ticket.category && (
        <span className="px-2 py-0.5 rounded-full text-[11px] text-white" style={{ backgroundColor: ticket.category.color }}>
          {ticket.category.name}
        </span>
      )}
    </div>
  );
}

function Assignee({ ticket }: { ticket: TicketListItem }) {
  if (!ticket.assignedTo) return null;
  return (
    <span className="type-meta truncate">
      Assigned {ticket.assignedTo.name}
      {ticket.assignedTo.isAiConsultant ? ' · AI' : ''}
    </span>
  );
}

const tick = 'font-mono text-[12px] tabular-nums text-iris';

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
        <article className="surface-card flex h-full flex-col items-center gap-2 px-3 py-5 text-center transition-colors hover:border-iris/35">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-iris/12 font-mono text-xl font-medium tabular-nums text-iris">
            {ticket.ticketNumber.replace('#ZEN-', '').slice(-2)}
          </span>
          <p className={tick}>{ticket.ticketNumber}</p>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{ticket.title}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLOR[ticket.status])}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </article>
      </Link>
    );
  }

  if (view === 'COMPACT') {
    return (
      <Link href={href} className="block">
        <article className="surface-card flex items-center gap-3 px-3 py-2.5 transition-colors hover:border-iris/35">
          <p className={cn(tick, 'w-24 shrink-0')}>{ticket.ticketNumber}</p>
          <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{ticket.title}</h3>
          <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLOR[ticket.status])}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </article>
      </Link>
    );
  }

  if (view === 'CARD') {
    return (
      <Link href={href} className="block h-full">
        <article className="surface-card flex h-full flex-col p-4 transition-colors hover:border-iris/35">
          <p className={tick}>{ticket.ticketNumber}</p>
          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug tracking-tight">{ticket.title}</h3>
          <p className="type-meta mt-1.5">{formatRelativeTime(ticket.createdAt)}</p>
          <div className="mt-3">
            <Badges ticket={ticket} />
          </div>
          {ticket.assignedTo && (
            <p className="mt-auto pt-3">
              <Assignee ticket={ticket} />
            </p>
          )}
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <article className="surface-card p-4 transition-colors hover:border-iris/35">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={tick}>{ticket.ticketNumber}</p>
            <h3 className="mt-1 truncate text-[15px] font-medium leading-snug">{ticket.title}</h3>
          </div>
          <span className="type-meta shrink-0">{formatRelativeTime(ticket.createdAt)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Badges ticket={ticket} />
          <Assignee ticket={ticket} />
        </div>
      </article>
    </Link>
  );
}

export function ticketGridClass(view: TicketView): string {
  if (view === 'ICON') return 'grid grid-cols-2 gap-3 app:grid-cols-4';
  if (view === 'CARD') return 'grid grid-cols-1 gap-3 app:grid-cols-2';
  return 'space-y-2';
}

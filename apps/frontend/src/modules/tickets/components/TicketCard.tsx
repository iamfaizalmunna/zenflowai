'use client';

import Link from 'next/link';
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: { name: string } | null;
  category?: { name: string; color: string } | null;
}

export function TicketCard({ ticket, href }: { ticket: TicketListItem; href: string }) {
  return (
    <Link href={href} className="block">
      <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</p>
            <h3 className="font-medium text-sm mt-0.5 truncate">{ticket.title}</h3>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">{formatRelativeTime(ticket.createdAt)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
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
          {ticket.assignedTo && (
            <span className="text-xs text-slate-500 px-1 py-0.5">Assigned: {ticket.assignedTo.name}</span>
          )}
        </div>
      </article>
    </Link>
  );
}

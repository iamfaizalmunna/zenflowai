import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

export interface FeedbackItem {
  id: number;
  ticketId: number;
  ticketNumber: string;
  title: string;
  status: string;
  rating: number;
  comment?: string | null;
  consultantName?: string | null;
  submittedAt?: string | null;
}

export function FeedbackList({ rows }: { rows: FeedbackItem[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No customer ratings yet.</p>;
  }
  return (
    <ul className="divide-y divide-border/50">
      {rows.map((row) => (
        <li key={row.id} className="py-3.5 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link href={`/tickets/${row.ticketId}`} className="text-xs font-mono text-muted-foreground">
              {row.ticketNumber}
            </Link>
            <span className="text-sm font-medium">{row.title}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">{row.rating}/5</span>
          </div>
          {row.comment ? <p className="text-sm text-foreground/90">{row.comment}</p> : (
            <p className="text-xs text-muted-foreground">Rated with no written note.</p>
          )}
          <p className="text-xs text-muted-foreground">
            {row.consultantName ?? 'Unassigned'} · {row.status.replace(/_/g, ' ')}
            {row.submittedAt ? ` · ${formatRelativeTime(row.submittedAt)}` : ''}
          </p>
        </li>
      ))}
    </ul>
  );
}

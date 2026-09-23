'use client';

import { LayoutGrid, List, RectangleHorizontal, Rows3 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import type { TicketSort, TicketView } from '@/lib/appearance';

const VIEWS: { id: TicketView; label: string; icon: typeof List }[] = [
  { id: 'LIST', label: 'List', icon: List },
  { id: 'COMPACT', label: 'Compact', icon: Rows3 },
  { id: 'CARD', label: 'Cards', icon: RectangleHorizontal },
  { id: 'ICON', label: 'Icons', icon: LayoutGrid },
];

export function TicketViewSwitch({
  view,
  onView,
}: {
  view: TicketView;
  onView: (value: TicketView) => void;
}) {
  return (
    <div className="flex min-w-0 w-fit max-w-full shrink-0 rounded-2xl border border-border/60 bg-card p-1" role="radiogroup" aria-label="Ticket view">
      {VIEWS.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={item.label}
            onClick={() => onView(item.id)}
            className={cn(
              'min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl px-2.5 text-muted-foreground',
              active && 'bg-primary text-primary-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export function TicketBrowseBar({
  status,
  priority,
  sort,
  view,
  onStatus,
  onPriority,
  onSort,
  onView,
  showView = true,
}: {
  status: string;
  priority: string;
  sort: TicketSort;
  view: TicketView;
  onStatus: (value: string) => void;
  onPriority: (value: string) => void;
  onSort: (value: TicketSort) => void;
  onView: (value: TicketView) => void;
  showView?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 app:flex-row app:flex-wrap app:items-center app:justify-end">
      <div className="grid grid-cols-2 gap-2 app:flex app:w-auto">
        <Select
          aria-label="Filter by status"
          value={status || 'ALL'}
          onValueChange={(value) => onStatus(value === 'ALL' ? '' : value)}
          className="min-h-10 app:w-40"
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'NEW', label: 'New' },
            { value: 'OPEN', label: 'Open' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'ON_HOLD', label: 'On hold' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'CLOSED', label: 'Closed' },
          ]}
        />
        <Select
          aria-label="Filter by priority"
          value={priority || 'ALL'}
          onValueChange={(value) => onPriority(value === 'ALL' ? '' : value)}
          className="min-h-10 app:w-36"
          options={[
            { value: 'ALL', label: 'All priorities' },
            { value: 'URGENT', label: 'Urgent' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
        />
        <Select
          aria-label="Sort tickets"
          value={sort}
          onValueChange={(value) => onSort(value as TicketSort)}
          className="min-h-10 col-span-2 app:col-span-1 app:w-40"
          options={[
            { value: 'UPDATED', label: 'Recently updated' },
            { value: 'CREATED', label: 'Newest' },
            { value: 'SLA', label: 'SLA due' },
            { value: 'PRIORITY', label: 'Priority' },
          ]}
        />
      </div>
      {showView ? <TicketViewSwitch view={view} onView={onView} /> : null}
    </div>
  );
}

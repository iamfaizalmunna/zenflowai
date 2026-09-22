'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '@/modules/notices/queries';

interface Notice {
  id: number;
  title: string;
  body: string;
  ticketId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const token = useAuthStore((s) => s.token);
  const { data, refetch } = useQuery(MY_NOTIFICATIONS, { pollInterval: 30_000, skip: !token });
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const items = (data?.myNotifications as Notice[] | undefined) ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer p-2 min-h-11 min-w-11 rounded-xl text-muted-foreground hover:text-foreground flex items-center justify-center">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-[10px] text-white leading-4 text-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </summary>
      <div className="absolute right-0 mt-1 w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-lg z-50 p-2 space-y-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground p-2">No notices yet</p>}
        {items.slice(0, 12).map((n) => (
          <Link
            key={n.id}
            href={n.ticketId ? `/tickets/${n.ticketId}` : '#'}
            onClick={() => {
              if (!n.isRead) void markRead({ variables: { id: n.id } }).then(() => refetch());
            }}
            className={cn('block rounded-lg p-2 text-xs hover:bg-muted', !n.isRead && 'bg-muted/60')}
          >
            <p className="font-medium text-foreground">{n.title}</p>
            <p className="text-muted-foreground line-clamp-2">{n.body}</p>
          </Link>
        ))}
      </div>
    </details>
  );
}

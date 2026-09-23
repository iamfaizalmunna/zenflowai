'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as Popover from '@radix-ui/react-popover';
import { useMutation, useQuery } from '@apollo/client';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { applyViewportClamp } from '@/lib/keepInViewport';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '@/modules/notices/queries';

interface Notice {
  id: number;
  title: string;
  body: string;
  ticketId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell({
  side = 'bottom',
  align = 'end',
}: {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}) {
  const token = useAuthStore((s) => s.token);
  const { data, refetch } = useQuery(MY_NOTIFICATIONS, { pollInterval: 30_000, skip: !token });
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const items = (data?.myNotifications as Notice[] | undefined) ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  useLayoutEffect(() => {
    if (!open) return;
    const clamp = () => {
      if (contentRef.current) applyViewportClamp(contentRef.current);
    };
    clamp();
    const frame = requestAnimationFrame(() => requestAnimationFrame(clamp));
    window.addEventListener('resize', clamp);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', clamp);
    };
  }, [open, items.length]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative p-2 min-h-11 min-w-11 rounded-xl text-muted-foreground hover:text-foreground flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground leading-4 text-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={{ top: 12, right: 16, bottom: 80, left: 12 }}
          avoidCollisions={false}
          aria-label="Notification list"
          role="dialog"
          className="z-[60] w-[min(20rem,calc(100vw-2rem))] max-h-[min(20rem,calc(100dvh-2rem))] overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl outline-none"
        >
          <p className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Notices</p>
          {items.length === 0 && <p className="text-xs text-muted-foreground p-2">No notices yet</p>}
          {items.slice(0, 12).map((n) => (
            <Link
              key={n.id}
              href={n.ticketId ? `/tickets/${n.ticketId}` : '#'}
              onClick={() => {
                setOpen(false);
                if (!n.isRead) void markRead({ variables: { id: n.id } }).then(() => refetch());
              }}
              className={cn('block rounded-xl p-2.5 text-xs hover:bg-muted', !n.isRead && 'bg-muted/60')}
            >
              <p className="font-medium text-foreground truncate">{n.title}</p>
              <p className="text-muted-foreground line-clamp-2 break-words">{n.body}</p>
            </Link>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

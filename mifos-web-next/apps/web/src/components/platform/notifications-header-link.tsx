'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSession } from '@mifos/auth';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { markAllNotificationsReadAction } from '@/actions/notifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotificationsUnreadCount } from '@/hooks/use-notifications-unread-count';
import { fetchRecentNotifications } from '@/lib/notifications/fetch-recent-notifications';
import { NOTIFICATIONS_LIST_PATH } from '@/lib/fineract/notification-paths';
import {
  formatNotificationsUnreadBadgeCount,
  notifyNotificationsChanged
} from '@/lib/notifications/unread-count';
import { cn } from '@/lib/utils';

const RECENT_NOTIFICATIONS_QUERY_KEY = ['notifications', 'recent'] as const;

function NotificationPreviewItem({
  item,
  onNavigate
}: {
  item: Awaited<ReturnType<typeof fetchRecentNotifications>>['items'][number];
  onNavigate: () => void;
}) {
  const body = (
    <div className="space-y-1 px-3 py-2.5">
      <p className="text-sm leading-snug">{item.displayContent}</p>
      {item.displayTime ? (
        <p className="text-xs text-muted-foreground">{item.displayTime}</p>
      ) : null}
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="block rounded-md transition-colors hover:bg-muted/70"
      >
        {body}
      </Link>
    );
  }

  return body;
}

export function NotificationsHeaderLink({
  initialCount
}: {
  initialCount?: number | null;
}) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const enabled = Boolean(session);
  const { data: count = 0 } = useNotificationsUnreadCount({
    enabled,
    initialCount
  });

  const recentQuery = useQuery({
    queryKey: RECENT_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => fetchRecentNotifications(8),
    enabled: enabled && open,
    staleTime: 15_000
  });

  if (!enabled) {
    return null;
  }

  const badgeLabel = formatNotificationsUnreadBadgeCount(count);
  const tooltip =
    count > 0
      ? `${count} unread ${count === 1 ? 'notification' : 'notifications'}`
      : 'No unread notifications';

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('All notifications marked as read.');
      notifyNotificationsChanged();
      void recentQuery.refetch();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className={cn(
                'relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                count > 0 && 'text-foreground'
              )}
              aria-label={tooltip}
            />
          }
        >
          <Bell className="size-4" aria-hidden />
          {count > 0 ? (
            <span
              className="absolute -top-0.5 -right-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
              aria-hidden
            >
              {badgeLabel}
            </span>
          ) : null}
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-medium">Notifications</p>
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={pending}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {recentQuery.isLoading ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">Loading notifications…</p>
          ) : recentQuery.isError ? (
            <p className="px-3 py-6 text-sm text-destructive">Could not load notifications.</p>
          ) : recentQuery.data?.items.length ? (
            <div className="divide-y divide-border">
              {recentQuery.data.items.map((item) => (
                <NotificationPreviewItem
                  key={item.id}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          ) : (
            <p className="px-3 py-6 text-sm text-muted-foreground">No unread notifications.</p>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={NOTIFICATIONS_LIST_PATH} onClick={() => setOpen(false)} />}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

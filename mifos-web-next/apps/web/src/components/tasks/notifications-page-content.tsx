'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { markAllNotificationsReadAction } from '@/actions/notifications';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { EnrichedNotification } from '@/lib/notifications/notification-display';
import { notifyNotificationsChanged } from '@/lib/notifications/unread-count';

export function NotificationsPageContent({
  notifications,
  totalRecords,
  unreadCount
}: {
  notifications: EnrichedNotification[];
  totalRecords: number;
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('All notifications marked as read.');
      notifyNotificationsChanged();
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Notifications"
      description="Activity updates for your account."
      actions={
        unreadCount > 0 ? (
          <Button type="button" variant="outline" disabled={pending} onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No unread notifications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">{item.displayContent}</p>
                  {item.displayTime ? (
                    <p className="text-xs text-muted-foreground">{item.displayTime}</p>
                  ) : null}
                </div>
                {item.href ? (
                  <Button
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    render={<Link href={item.href} />}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    {item.hrefLabel ?? 'Open record'}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {totalRecords > notifications.length ? (
            <p className="text-sm text-muted-foreground">
              Showing {notifications.length} of {totalRecords} unread notifications.
            </p>
          ) : null}
        </div>
      )}
    </ListPage>
  );
}

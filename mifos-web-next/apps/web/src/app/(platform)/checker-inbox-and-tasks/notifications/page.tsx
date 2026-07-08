/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { NotificationsPageContent } from '@/components/tasks/notifications-page-content';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { enrichNotifications } from '@/lib/notifications/notification-display';
import { getNotificationsUnreadCount, listNotifications } from '@/lib/fineract/notifications';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const [pageResult, unreadCount] = await Promise.all([
    tryFineractLoad(
      () => listNotifications({ unreadOnly: true, limit: 50, offset: 0 }),
      'Could not load notifications.'
    ),
    getNotificationsUnreadCount().catch(() => 0)
  ]);

  if (!pageResult.ok) {
    return (
      <ListPage title="Notifications">
        <LoadErrorAlert title="Could not load notifications" message={pageResult.message} />
      </ListPage>
    );
  }

  const notifications = await enrichNotifications(pageResult.data?.pageItems ?? []);

  return (
    <NotificationsPageContent
      notifications={notifications}
      totalRecords={pageResult.data?.totalFilteredRecords ?? notifications.length}
      unreadCount={unreadCount}
    />
  );
}

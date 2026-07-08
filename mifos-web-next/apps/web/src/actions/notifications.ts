'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { NOTIFICATIONS_LIST_PATH } from '@/lib/fineract/notification-paths';
import { markAllNotificationsRead } from '@/lib/fineract/notifications';
import { getServerSession } from '@/lib/session/server';

export type NotificationsActionResult = { ok: true } | { ok: false; message: string };

export async function markAllNotificationsReadAction(): Promise<NotificationsActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in to update notifications.' };
  }

  try {
    await markAllNotificationsRead();
    revalidatePath(NOTIFICATIONS_LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to mark notifications as read.');
  }
}

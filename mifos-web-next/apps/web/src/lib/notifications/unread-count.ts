/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** TanStack Query key for the header unread notifications badge. */
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const;

export const NOTIFICATIONS_CHANGED_EVENT = 'notifications-changed';

export function notifyNotificationsChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}

export async function fetchNotificationsUnreadCount(): Promise<number> {
  const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load unread notification count.');
  }
  const data = (await response.json()) as { count?: number };
  return typeof data.count === 'number' && Number.isFinite(data.count) ? data.count : 0;
}

export function formatNotificationsUnreadBadgeCount(count: number): string {
  if (count > 99) {
    return '99+';
  }
  return String(count);
}

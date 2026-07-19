/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** TanStack Query key for the header pending-count badge. */
export const CHECKER_INBOX_PENDING_COUNT_QUERY_KEY = ['checker-inbox', 'pending-count'] as const;

export const CHECKER_INBOX_PENDING_CHANGED_EVENT = 'checker-inbox-pending-changed';

/** Notify listeners (header badge) to refresh the pending count. */
export function notifyCheckerInboxPendingChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(CHECKER_INBOX_PENDING_CHANGED_EVENT));
}

export async function fetchCheckerInboxPendingCount(): Promise<number> {
  const response = await fetch('/api/checker-inbox/pending-count', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load pending checker count.');
  }
  const data = (await response.json()) as { count?: number };
  return typeof data.count === 'number' && Number.isFinite(data.count) ? data.count : 0;
}

export function formatCheckerInboxPendingBadgeCount(count: number): string {
  if (count > 99) {
    return '99+';
  }
  return String(count);
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { EnrichedNotification } from '@/lib/notifications/notification-display';

export async function fetchRecentNotifications(limit = 8): Promise<{
  totalFilteredRecords: number;
  items: EnrichedNotification[];
}> {
  const response = await fetch(`/api/notifications?limit=${limit}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load notifications.');
  }
  return (await response.json()) as {
    totalFilteredRecords: number;
    items: EnrichedNotification[];
  };
}

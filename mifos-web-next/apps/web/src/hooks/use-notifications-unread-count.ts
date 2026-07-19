'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  fetchNotificationsUnreadCount,
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
} from '@/lib/notifications/unread-count';

const REFETCH_INTERVAL_MS = 60_000;
const STALE_TIME_MS = 30_000;

export function useNotificationsUnreadCount({
  enabled,
  initialCount
}: {
  enabled: boolean;
  initialCount?: number | null;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onChanged() {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });
    }

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchNotificationsUnreadCount,
    enabled,
    initialData: initialCount ?? undefined,
    staleTime: STALE_TIME_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false
  });
}

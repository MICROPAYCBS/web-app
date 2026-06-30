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
  CHECKER_INBOX_PENDING_CHANGED_EVENT,
  CHECKER_INBOX_PENDING_COUNT_QUERY_KEY,
  fetchCheckerInboxPendingCount
} from '@/lib/checker-inbox/pending-count';

const REFETCH_INTERVAL_MS = 60_000;
const STALE_TIME_MS = 30_000;

export function useCheckerInboxPendingCount({
  enabled,
  initialCount
}: {
  enabled: boolean;
  /** SSR seed from platform layout; omit when unknown or unavailable. */
  initialCount?: number | null;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onPendingChanged() {
      void queryClient.invalidateQueries({ queryKey: CHECKER_INBOX_PENDING_COUNT_QUERY_KEY });
    }

    window.addEventListener(CHECKER_INBOX_PENDING_CHANGED_EVENT, onPendingChanged);
    return () => window.removeEventListener(CHECKER_INBOX_PENDING_CHANGED_EVENT, onPendingChanged);
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: CHECKER_INBOX_PENDING_COUNT_QUERY_KEY,
    queryFn: fetchCheckerInboxPendingCount,
    enabled,
    initialData: initialCount ?? undefined,
    staleTime: STALE_TIME_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false
  });
}

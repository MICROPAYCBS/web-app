'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCan, resolvePermission } from '@mifos/auth';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCheckerInboxPendingCount } from '@/hooks/use-checker-inbox-pending-count';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';
import { formatCheckerInboxPendingBadgeCount } from '@/lib/checker-inbox/pending-count';
import { cn } from '@/lib/utils';

export function CheckerInboxHeaderLink({
  initialCount
}: {
  initialCount?: number | null;
}) {
  const canViewCheckerInbox = useCan(resolvePermission('checkerInbox'));
  const { data: count = 0 } = useCheckerInboxPendingCount({
    enabled: canViewCheckerInbox,
    initialCount
  });

  if (!canViewCheckerInbox) {
    return null;
  }

  const badgeLabel = formatCheckerInboxPendingBadgeCount(count);
  const tooltip =
    count > 0
      ? `${count} pending maker-checker ${count === 1 ? 'request' : 'requests'}`
      : 'No pending maker-checker requests';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={CHECKER_INBOX_LIST_PATH}
            className={cn(
              'relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              count > 0 && 'text-foreground'
            )}
            aria-label={tooltip}
          />
        }
      >
        <ClipboardCheck className="size-4" aria-hidden />
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
  );
}

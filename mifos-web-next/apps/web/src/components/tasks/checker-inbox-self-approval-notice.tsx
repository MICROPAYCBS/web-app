'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxSelfApprovalBlock } from '@/lib/checker-inbox/checker-inbox-self-approval';
import { cn } from '@/lib/utils';

export function CheckerInboxSelfApprovalNotice({
  block,
  className
}: {
  block: CheckerInboxSelfApprovalBlock;
  className?: string;
}) {
  if (!block.blocked || !block.reason) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        'rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground',
        className
      )}
    >
      <p className="font-medium">You cannot act on your own submission</p>
      <p className="mt-1 text-muted-foreground">{block.reason}</p>
    </div>
  );
}

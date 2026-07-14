/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { GlAccountEnquirySummarySkeleton } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-summary-panel';
import { ListPage } from '@/components/composites/list-page';
import { Skeleton } from '@/components/ui/skeleton';

function TableSkeleton({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <div className="rounded-md border border-border" aria-hidden>
      <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columnCount }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function GlAccountEnquiryLoading() {
  return (
    <ListPage
      title="GL account enquiry"
      description="Search journal activity for a single GL account with opening and closing balances."
    >
      <div className="space-y-4" aria-busy aria-label="Loading GL account enquiry">
        <GlAccountEnquirySummarySkeleton />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
        <TableSkeleton columnCount={6} rowCount={8} />
      </div>
    </ListPage>
  );
}

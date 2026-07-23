/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder matching {@link ReportResultTable} (filter, export, rows).
 */
export function ReportResultTableSkeleton({
  columnCount = 4,
  rowCount = 10
}: {
  columnCount?: number;
  rowCount?: number;
}) {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading report results">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-sm rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="rounded-md border border-border" aria-hidden>
        <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {Array.from({ length: columnCount }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 flex-1"
                style={{
                  maxWidth:
                    colIndex === 0 ? '30%' : colIndex === columnCount - 1 ? '25%' : undefined
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3" aria-hidden>
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

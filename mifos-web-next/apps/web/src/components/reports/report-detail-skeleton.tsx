/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { Skeleton } from '@/components/ui/skeleton';

function DetailFieldSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-full max-w-[12rem]" />
    </div>
  );
}

/**
 * Loading placeholder for {@link ReportDetailView} (`/system/reports/[reportId]`).
 */
export function ReportDetailSkeleton() {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<Skeleton className="h-4 w-48" aria-hidden />}
          title={<Skeleton className="h-8 w-64 max-w-full" aria-hidden />}
          meta={<Skeleton className="h-4 w-40" aria-hidden />}
          actions={
            <div className="flex flex-wrap gap-2" aria-hidden>
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          }
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <DetailFieldSkeleton key={index} />
          ))}
        </DetailFieldGrid>
      }
    >
      <div className="space-y-6" aria-busy aria-label="Loading report details">
        <div className="space-y-2 rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-4 w-24" />
          <div className="overflow-hidden rounded-md border border-border">
            <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/40 px-4 py-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DetailPage>
  );
}

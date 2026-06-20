/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites/list-page';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportRunSkeleton() {
  return (
    <ListPage
      backLink={<Skeleton className="h-4 w-28" />}
      title={<Skeleton className="h-8 w-64 max-w-full" />}
      meta={<Skeleton className="h-4 w-40" />}
      actions={
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      }
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <Skeleton className="h-9 w-48 max-w-full" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="space-y-0">
            <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-4 flex-1" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, row) => (
              <div key={row} className="flex gap-4 border-b border-border px-4 py-3 last:border-0">
                {Array.from({ length: 4 }).map((_, col) => (
                  <Skeleton key={col} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ListPage>
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites/list-page';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for {@link ReportRunPageContent} before report metadata loads.
 * Matches the initial empty results state — not a populated results table.
 */
export function ReportRunSkeleton() {
  return (
    <ListPage
      backLink={<Skeleton className="h-4 w-32" aria-hidden />}
      title={<Skeleton className="h-8 w-64 max-w-full" aria-hidden />}
      meta={<Skeleton className="h-4 w-40" aria-hidden />}
      actions={
        <div className="flex flex-wrap gap-2" aria-hidden>
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      }
    >
      <div className="space-y-4" aria-busy aria-label="Loading report">
        <Skeleton className="h-4 w-40" />
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border px-6 py-10">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    </ListPage>
  );
}

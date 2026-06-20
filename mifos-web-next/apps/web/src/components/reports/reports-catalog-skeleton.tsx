/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites/list-page';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ReportCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex flex-wrap justify-end gap-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function ReportsCatalogSkeleton() {
  return (
    <ListPage
      title="Reports"
      description="Browse and run reports configured for your role."
    >
      <div className="space-y-6">
        <Skeleton className="h-9 max-w-md rounded-md" />

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        <div className="space-y-8 pb-6">
          {[0, 1].map((section) => (
            <section key={section} className="space-y-4">
              <Skeleton className="h-7 w-36" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <ReportCardSkeleton key={index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </ListPage>
  );
}

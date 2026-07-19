/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites/list-page';
import { Skeleton } from '@/components/ui/skeleton';

export interface SystemDatatableFormSkeletonProps {
  title: string;
  description: string;
  mode?: 'create' | 'edit';
}

function FormFieldSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function ColumnsTableSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="rounded-md border border-border">
        <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
        <div className="px-4 py-8">
          <Skeleton className="mx-auto h-4 w-64 max-w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading placeholder for create/edit data table forms.
 */
export function SystemDatatableFormSkeleton({
  title,
  description,
  mode = 'create'
}: SystemDatatableFormSkeletonProps) {
  return (
    <ListPage
      title={title}
      description={description}
      actions={<Skeleton className="h-9 w-20 rounded-md" aria-hidden />}
    >
      <div
        className="space-y-0 rounded-lg border border-border"
        aria-busy
        aria-label={`Loading ${title}`}
      >
        <div className="space-y-6 p-6">
          {mode === 'create' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <FormFieldSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2" aria-hidden>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full max-w-[10rem]" />
                </div>
              ))}
            </div>
          )}

          <ColumnsTableSkeleton />
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
    </ListPage>
  );
}

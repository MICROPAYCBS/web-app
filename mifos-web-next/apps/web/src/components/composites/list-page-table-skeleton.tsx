/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { ListPage } from '@/components/composites/list-page';

import { Skeleton } from '@/components/ui/skeleton';



export interface ListPageTableSkeletonProps {

  title: string;

  description?: string;

  /** Placeholder for a primary header action (e.g. Create). */

  showAction?: boolean;

  showSearch?: boolean;

  /** Extra filter/control placeholders beside search (e.g. checkbox). */

  filterCount?: number;

  columnCount?: number;

  rowCount?: number;

  showPagination?: boolean;

  /** Tab pills below the header (e.g. Manage jobs). */

  tabCount?: number;

}



function TableSkeleton({

  columnCount,

  rowCount

}: {

  columnCount: number;

  rowCount: number;

}) {

  return (

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

              style={{ maxWidth: colIndex === 0 ? '40%' : undefined }}

            />

          ))}

        </div>

      ))}

    </div>

  );

}



/**

 * Loading placeholder matching {@link ListPage} + {@link DataTable} layout.

 */

export function ListPageTableSkeleton({

  title,

  description,

  showAction = true,

  showSearch = true,

  filterCount = 0,

  columnCount = 5,

  rowCount = 8,

  showPagination = true,

  tabCount

}: ListPageTableSkeletonProps) {

  return (

    <ListPage

      title={title}

      description={description}

      actions={showAction ? <Skeleton className="h-9 w-32 rounded-md" aria-hidden /> : undefined}

    >

      <div className="space-y-4" aria-busy aria-label={`Loading ${title}`}>

        {tabCount ? (

          <div className="flex flex-wrap gap-2">

            {Array.from({ length: tabCount }).map((_, index) => (

              <Skeleton key={index} className="h-9 w-24 rounded-md" />

            ))}

          </div>

        ) : null}



        {showSearch || filterCount > 0 ? (

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {showSearch ? <Skeleton className="h-9 max-w-sm flex-1 rounded-md" /> : null}

            {filterCount > 0 ? (

              <div className="flex flex-wrap items-center gap-3">

                {Array.from({ length: filterCount }).map((_, index) => (

                  <Skeleton key={index} className="h-5 w-28" />

                ))}

              </div>

            ) : null}

          </div>

        ) : null}



        <TableSkeleton columnCount={columnCount} rowCount={rowCount} />



        {showPagination ? (

          <div className="flex flex-wrap items-center justify-between gap-3">

            <Skeleton className="h-4 w-40" />

            <div className="flex items-center gap-2">

              <Skeleton className="size-8 rounded-md" />

              <Skeleton className="size-8 rounded-md" />

              <Skeleton className="h-4 w-16" />

              <Skeleton className="size-8 rounded-md" />

              <Skeleton className="size-8 rounded-md" />

            </div>

          </div>

        ) : null}

      </div>

    </ListPage>

  );

}



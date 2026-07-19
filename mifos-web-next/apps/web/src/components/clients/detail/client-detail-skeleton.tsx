/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailPage } from '@/components/composites';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Nav groups: General · accounts (5) · lists (9) — matches {@link clientDetailNavGroups}. */
const CLIENT_DETAIL_NAV_GROUP_SIZES = [1, 5, 9] as const;

function ClientDetailNavSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="inline-flex items-center gap-1.5 px-3">
        <Skeleton className="size-4 shrink-0 rounded-sm" />
        <Skeleton className="h-4 w-32" />
      </div>
      <nav className="flex flex-col gap-4">
        {CLIENT_DETAIL_NAV_GROUP_SIZES.map((itemCount, groupIndex) => (
          <ul key={groupIndex} className="flex flex-col gap-0.5">
            {Array.from({ length: itemCount }).map((_, itemIndex) => (
              <li key={itemIndex} className="flex items-center gap-2 rounded-md px-3 py-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton
                  className={cn(
                    'h-4 w-24',
                    itemIndex % 3 === 1 && 'w-28',
                    itemIndex % 3 === 2 && 'w-32'
                  )}
                />
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </div>
  );
}

/** Matches {@link ClientDetailTop} — avatar, signature, title row, meta lines, actions. */
export function ClientDetailHeaderSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-[4.5rem] rounded-md" />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-52 max-w-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="h-4 w-40" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-36" />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-28" />
                ))}
              </div>
            </div>
            <Skeleton className="size-9 shrink-0 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSectionCardSkeleton({ fieldCount = 6 }: { fieldCount?: number }) {
  return (
    <div className="overflow-visible rounded-xl border border-border shadow-none" aria-hidden>
      <div className="flex flex-col gap-1.5 border-b border-border p-6 pb-4">
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="p-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full max-w-[14rem]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinancialSummarySectionSkeleton() {
  return (
    <div className="overflow-visible rounded-xl border border-border shadow-none" aria-hidden>
      <div className="flex flex-col gap-1.5 border-b border-border p-6 pb-4">
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="divide-y divide-border px-6 pb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 py-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[9rem]" />
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableTabSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="rounded-md border border-border">
        <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** General tab body — two columns like {@link ClientGeneralSections}. */
export function ClientDetailGeneralSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy aria-label="Loading customer details">
      <div className="space-y-6">
        <DetailSectionCardSkeleton fieldCount={8} />
        <DetailSectionCardSkeleton fieldCount={4} />
      </div>
      <FinancialSummarySectionSkeleton />
    </div>
  );
}

/** List / account tabs — section heading + data table. */
export function ClientDetailTableTabSkeleton() {
  return (
    <div aria-busy aria-label="Loading customer details">
      <TableTabSkeleton />
    </div>
  );
}

/** Full chrome while the detail layout loads. */
export function ClientDetailShellSkeleton() {
  return (
    <DetailPage
      header={<ClientDetailHeaderSkeleton />}
      sidebar={<ClientDetailNavSkeleton />}
    >
      <ClientDetailGeneralSkeleton />
    </DetailPage>
  );
}

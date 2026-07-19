/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { platformScrollRegion } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export interface DashboardSkeletonProps {
  /** Placeholder KPI cards in the grid */
  cardCount?: number;
  className?: string;
}

function DashboardStatCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 pb-3 pt-3">
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="mt-auto border-t bg-muted/50 px-4 py-3">
        <Skeleton className="h-3 w-full max-w-[12rem]" />
      </div>
    </div>
  );
}

/** KPI filters + card grid placeholder for {@link DashboardKpiSection}. */
export function DashboardKpiSectionSkeleton({
  cardCount = 8,
  showFilters = true
}: {
  cardCount?: number;
  showFilters?: boolean;
}) {
  return (
    <>
      {showFilters ? (
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          aria-hidden
        >
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <DashboardStatCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

/**
 * Loading placeholder matching {@link DashboardPageContent} layout.
 */
export function DashboardSkeleton({ cardCount = 8, className }: DashboardSkeletonProps) {
  return (
    <div
      className={cn(platformScrollRegion, className)}
      aria-busy
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="space-y-2 px-4 lg:px-6" aria-hidden>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>

        <section className="space-y-4 px-4 lg:px-6">
          <DashboardKpiSectionSkeleton cardCount={cardCount} />
        </section>
      </div>
    </div>
  );
}

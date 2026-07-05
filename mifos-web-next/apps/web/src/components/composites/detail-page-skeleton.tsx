/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PageHeader } from '@/components/composites/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  detailSidebarInsetX,
  pageHeaderContentSpacing,
  platformInset,
  platformPageShell,
  platformSidebarRowLayout
} from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

export interface DetailPageSkeletonProps {
  /** Items in the left navigation rail */
  sidebarItemCount?: number;
  /** When false, uses stacked {@link DetailPage} layout (no left rail). */
  showSidebar?: boolean;
  /** Profile avatar block in the header (customer detail) */
  showAvatar?: boolean;
  /** Summary field grid below the title row */
  summaryFieldCount?: number;
  /** Content card sections in the scrollable body */
  contentSectionCount?: number;
  /** Render table placeholders in content sections instead of field grids */
  tableSection?: boolean;
  className?: string;
}

function DetailHeaderSkeleton({
  showAvatar,
  summaryFieldCount
}: {
  showAvatar: boolean;
  summaryFieldCount: number;
}) {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {showAvatar ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-56 max-w-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>

          {summaryFieldCount > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: summaryFieldCount }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full max-w-[12rem]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-36" />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-28" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TableSectionSkeleton() {
  return (
    <div className="rounded-md border border-border" aria-hidden>
      <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
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
  );
}

function ContentSectionSkeleton({ tableSection }: { tableSection: boolean }) {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {tableSection ? (
        <TableSectionSkeleton />
      ) : (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading placeholder matching {@link DetailPage} layout (sidebar + header + body).
 */
export function DetailPageSkeleton({
  sidebarItemCount = 10,
  showSidebar = true,
  showAvatar = true,
  summaryFieldCount = 0,
  contentSectionCount = 2,
  tableSection = false,
  className
}: DetailPageSkeletonProps) {
  const body = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader className={pageHeaderContentSpacing}>
        <DetailHeaderSkeleton showAvatar={showAvatar} summaryFieldCount={summaryFieldCount} />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cn(platformInset, 'space-y-6', showSidebar && 'lg:pl-8')}>
          {Array.from({ length: contentSectionCount }).map((_, index) => (
            <ContentSectionSkeleton key={index} tableSection={tableSection} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!showSidebar) {
    return (
      <div
        className={cn(platformPageShell, className)}
        aria-busy
        aria-label="Loading detail page"
      >
        {body}
      </div>
    );
  }

  return (
    <div
      className={cn(platformSidebarRowLayout, className)}
      aria-busy
      aria-label="Loading detail page"
    >
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-border',
          'max-h-[min(40vh,20rem)] border-b lg:max-h-none lg:w-56 lg:min-h-0 lg:self-stretch lg:border-b-0 lg:border-r xl:w-60'
        )}
        aria-hidden
      >
        <div className={cn(detailSidebarInsetX, 'min-h-0 flex-1 overflow-hidden pb-4 md:pb-6')}>
          <div className="space-y-1">
            {Array.from({ length: sidebarItemCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </aside>
      {body}
    </div>
  );
}

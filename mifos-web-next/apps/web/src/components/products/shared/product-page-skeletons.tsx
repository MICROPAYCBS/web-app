/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailPageSkeleton } from '@/components/composites/detail-page-skeleton';
import { ListPageTableSkeleton } from '@/components/composites/list-page-table-skeleton';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';

export type ProductListPageSkeletonProps = {
  title: string;
  description: string;
  columnCount?: number;
  filterCount?: number;
};

/** List loading state for loan, savings, deposit, and share product catalogs. */
export function ProductListPageSkeleton({
  title,
  description,
  columnCount = 4,
  filterCount = 0
}: ProductListPageSkeletonProps) {
  return (
    <ListPageTableSkeleton
      title={title}
      description={description}
      showAction
      showSearch
      filterCount={filterCount}
      columnCount={columnCount}
    />
  );
}

export type ProductDetailPageSkeletonProps = {
  sidebarItemCount?: number;
};

/** Detail loading state for product definition pages with a section sidebar. */
export function ProductDetailPageSkeleton({
  sidebarItemCount = 5
}: ProductDetailPageSkeletonProps) {
  return (
    <PlatformRouteLayout>
      <DetailPageSkeleton
        showAvatar={false}
        sidebarItemCount={sidebarItemCount}
        contentSectionCount={1}
      />
    </PlatformRouteLayout>
  );
}

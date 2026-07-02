/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPageTableSkeleton } from '@/components/composites/list-page-table-skeleton';

export default function OrganizationIndustriesLoading() {
  return (
    <ListPageTableSkeleton
      title="Industries"
      description="Manage industries within economic sectors."
      showSearch={false}
      columnCount={5}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPageTableSkeleton } from '@/components/composites/list-page-table-skeleton';

export default function ExternalEventsLoading() {
  return (
    <ListPageTableSkeleton
      title="External events"
      description="Enable or disable event types published to external systems. Changes apply when you save."
      showAction={false}
      showSearch={false}
      columnCount={3}
    />
  );
}

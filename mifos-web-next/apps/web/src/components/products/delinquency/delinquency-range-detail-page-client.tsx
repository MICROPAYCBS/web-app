'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeDetail } from '@mifos/api-client';
import { DelinquencyRangeDetailView } from '@/components/products/delinquency/delinquency-range-detail-view';
import { DelinquencyRangeEditUrlPanel } from '@/components/products/delinquency/delinquency-range-edit-url-panel';

export function DelinquencyRangeDetailPageClient({
  range,
  canEdit,
  canDelete
}: {
  range: DelinquencyRangeDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <DelinquencyRangeDetailView range={range} canEdit={canEdit} canDelete={canDelete} />
      {canEdit ? <DelinquencyRangeEditUrlPanel range={range} /> : null}
    </>
  );
}

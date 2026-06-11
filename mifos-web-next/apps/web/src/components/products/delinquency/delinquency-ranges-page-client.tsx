'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeListItem } from '@mifos/api-client';
import { DelinquencyRangeCreateUrlPanel } from '@/components/products/delinquency/delinquency-range-create-url-panel';
import { DelinquencyRangesPageContent } from '@/components/products/delinquency/delinquency-ranges-page-content';

export function DelinquencyRangesPageClient({
  ranges,
  canCreate
}: {
  ranges: DelinquencyRangeListItem[];
  canCreate: boolean;
}) {
  return (
    <>
      <DelinquencyRangesPageContent ranges={ranges} />
      {canCreate ? <DelinquencyRangeCreateUrlPanel /> : null}
    </>
  );
}

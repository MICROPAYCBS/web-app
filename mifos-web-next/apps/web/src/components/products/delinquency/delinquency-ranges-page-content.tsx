'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { DelinquencyRangesTable } from '@/components/products/delinquency/delinquency-ranges-table';
import { buttonVariants } from '@/components/ui/button';
import {
  delinquencyConfigurationsPath,
  delinquencyRangeCreatePath
} from '@/lib/fineract/delinquency-paths';
import { cn } from '@/lib/utils';

export function DelinquencyRangesPageContent({
  ranges
}: {
  ranges: DelinquencyRangeListItem[];
}) {
  return (
    <ListPage
      title="Delinquency ranges"
      description="Day ranges used to classify overdue loans."
      backLink={
        <DetailBackLink
          href={delinquencyConfigurationsPath()}
          label="Back to delinquency buckets"
        />
      }
      actions={
        <Can permission="CREATE_DELINQUENCY_RANGE">
          <Link href={delinquencyRangeCreatePath()} className={cn(buttonVariants())}>
            Create delinquency range
          </Link>
        </Can>
      }
    >
      <DelinquencyRangesTable ranges={ranges} />
    </ListPage>
  );
}

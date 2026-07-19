'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyBucketListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { DelinquencyBucketsTable } from '@/components/products/delinquency/delinquency-buckets-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  delinquencyBucketCreatePath,
  delinquencyConfigurationsPath
} from '@/lib/fineract/delinquency-paths';
export function DelinquencyBucketsPageContent({
  buckets
}: {
  buckets: DelinquencyBucketListItem[];
}) {
  return (
    <ListPage
      title="Delinquency buckets"
      description="Named sets of ranges assigned to loan products."
      backLink={
        <DetailBackLink
          href={delinquencyConfigurationsPath()}
          label="Back to delinquency buckets"
        />
      }
      actions={
        <Can permission="CREATE_DELINQUENCY_BUCKET">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button>
                  Create delinquency bucket
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={delinquencyBucketCreatePath('regular')} />}>
                Regular bucket
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href={delinquencyBucketCreatePath('workingcapital')} />}
              >
                Working capital bucket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Can>
      }
    >
      <DelinquencyBucketsTable buckets={buckets} />
    </ListPage>
  );
}

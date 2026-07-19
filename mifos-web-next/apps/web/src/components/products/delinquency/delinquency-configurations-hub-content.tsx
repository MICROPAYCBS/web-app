'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import {
  delinquencyBucketsListPath,
  delinquencyRangesListPath
} from '@/lib/fineract/delinquency-paths';
import { cn } from '@/lib/utils';

export function DelinquencyConfigurationsHubContent() {
  return (
    <ListPage
      title="Delinquency buckets"
      description="Define day ranges and group them into buckets for loan product configuration."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Can permission="READ_DELINQUENCY_RANGE">
          <Link
            href={delinquencyRangesListPath()}
            className={cn(
              'rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40'
            )}
          >
            <h2 className="font-medium">Delinquency ranges</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Define overdue day ranges with classifications.
            </p>
            <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
              Manage ranges
            </span>
          </Link>
        </Can>
        <Can permission="READ_DELINQUENCY_BUCKET">
          <Link
            href={delinquencyBucketsListPath()}
            className={cn(
              'rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40'
            )}
          >
            <h2 className="font-medium">Delinquency buckets</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bundle ranges into regular or working capital buckets.
            </p>
            <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
              Manage buckets
            </span>
          </Link>
        </Can>
      </div>
    </ListPage>
  );
}

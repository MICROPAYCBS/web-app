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
import { taxComponentsListPath, taxGroupsListPath } from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

export function TaxConfigurationsHubContent() {
  return (
    <ListPage
      title="Tax configurations"
      description="Define tax components and group them for use on loan and savings products."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Can permission="READ_TAXCOMPONENT">
          <Link
            href={taxComponentsListPath()}
            className={cn(
              'rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40'
            )}
          >
            <h2 className="font-medium">Tax components</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Define percentage rates and ledger accounts for each tax component.
            </p>
            <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
              Manage components
            </span>
          </Link>
        </Can>
        <Can permission="READ_TAXGROUP">
          <Link
            href={taxGroupsListPath()}
            className={cn(
              'rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40'
            )}
          >
            <h2 className="font-medium">Tax groups</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bundle tax components into groups with effective dates.
            </p>
            <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
              Manage groups
            </span>
          </Link>
        </Can>
      </div>
    </ListPage>
  );
}

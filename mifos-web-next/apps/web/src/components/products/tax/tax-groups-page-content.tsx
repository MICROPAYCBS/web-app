'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxGroupListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { DetailBackLink, EmptyState } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { TaxGroupsTable } from '@/components/products/tax/tax-groups-table';
import { buttonVariants } from '@/components/ui/button';
import { taxConfigurationsPath, taxGroupCreatePath } from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

function CreateTaxGroupLink({ size }: { size?: 'default' | 'sm' }) {
  return (
    <Can permission="CREATE_TAXGROUP">
      <Link href={taxGroupCreatePath()} className={cn(buttonVariants({ size }))}>
        Create tax group
      </Link>
    </Can>
  );
}

export function TaxGroupsPageContent({ groups }: { groups: TaxGroupListItem[] }) {
  return (
    <ListPage
      title="Tax groups"
      description="Bundles of tax components with start and end dates for product configuration."
      backLink={
        <DetailBackLink href={taxConfigurationsPath()} label="Back to tax configurations" />
      }
      actions={<CreateTaxGroupLink />}
    >
      {groups.length === 0 ? (
        <EmptyState
          title="No tax groups yet"
          description="Bundle tax components into a group so products can withhold tax."
          action={<CreateTaxGroupLink size="sm" />}
        />
      ) : (
        <TaxGroupsTable groups={groups} />
      )}
    </ListPage>
  );
}

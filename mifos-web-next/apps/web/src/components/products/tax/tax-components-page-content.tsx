'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { TaxComponentsTable } from '@/components/products/tax/tax-components-table';
import { buttonVariants } from '@/components/ui/button';
import {
  taxComponentCreatePath,
  taxConfigurationsPath
} from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

export function TaxComponentsPageContent({
  components
}: {
  components: TaxComponentListItem[];
}) {
  return (
    <ListPage
      title="Tax components"
      description="Percentage rates and ledger mappings used when tax is applied to products."
      backLink={
        <DetailBackLink href={taxConfigurationsPath()} label="Back to tax configurations" />
      }
      actions={
        <Can permission="CREATE_TAXCOMPONENT">
          <Link href={taxComponentCreatePath()} className={cn(buttonVariants())}>
            Create tax component
          </Link>
        </Can>
      }
    >
      <TaxComponentsTable components={components} />
    </ListPage>
  );
}

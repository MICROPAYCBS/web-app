'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeListItem, ChargeTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { ChargesTable } from '@/components/products/charges/charges-table';
import { buttonVariants } from '@/components/ui/button';
import { chargeCreatePath } from '@/lib/fineract/charge-paths';
import { cn } from '@/lib/utils';

export function ChargesPageContent({
  charges,
  appliesToOptions
}: {
  charges: ChargeListItem[];
  appliesToOptions: ChargeTemplate['chargeAppliesToOptions'];
}) {
  return (
    <ListPage
      title="Charges"
      description="Fees and penalties applied to loans, savings, deposits, shares, and customers."
      actions={
        <Can permission="CREATE_CHARGE">
          <Link href={chargeCreatePath()} className={cn(buttonVariants())}>
            Create charge
          </Link>
        </Can>
      }
    >
      <ChargesTable
        charges={charges}
        appliesToOptions={appliesToOptions ?? []}
      />
    </ListPage>
  );
}

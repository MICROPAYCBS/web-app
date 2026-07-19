'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { CurrenciesTable } from '@/components/organization/currencies-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { organizationCurrenciesManagePath } from '@/lib/fineract/organization-currency-paths';
import { cn } from '@/lib/utils';

export function CurrenciesPageContent({
  selectedCurrencies
}: {
  selectedCurrencies: FineractCurrencyOption[];
}) {
  return (
    <ListPage
      title="Currencies"
      description="Currencies currently enabled for your organization."
      actions={
        <Can permission="UPDATE_CURRENCY">
          <Link href={organizationCurrenciesManagePath()} className={cn(buttonVariants())}>
            Add / edit
          </Link>
        </Can>
      }
    >
      <CurrenciesTable currencies={selectedCurrencies} />
    </ListPage>
  );
}

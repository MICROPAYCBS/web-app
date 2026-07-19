'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { legalTenderListPath } from '@/lib/fineract/legal-tender-paths';
import { cn } from '@/lib/utils';

export function LegalTenderHubPageContent({
  currencies
}: {
  currencies: FineractCurrencyOption[];
}) {
  return (
    <ListPage
      title="Legal tenders"
      description="Choose a currency to manage its note and coin denominations for cashier cash movements."
    >
      <div className="overflow-hidden rounded-md border">
        <ul className="divide-y divide-border">
          {currencies.length > 0 ? (
            currencies.map((currency) => (
              <li
                key={currency.code}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{currency.code}</p>
                  {currency.name ? (
                    <p className="text-sm text-muted-foreground">{currency.name}</p>
                  ) : null}
                </div>
                <Link
                  href={legalTenderListPath(currency.code!)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Manage denominations
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-sm text-muted-foreground">
              No organization currencies are configured yet.
            </li>
          )}
        </ul>
      </div>
    </ListPage>
  );
}

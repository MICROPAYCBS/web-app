'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { SavingsProductsTable } from '@/components/products/savings/savings-products-table';
import { buttonVariants } from '@/components/ui/button';
import { savingsProductCreatePath } from '@/lib/fineract/savings-product-paths';
import { cn } from '@/lib/utils';

export function SavingsProductsPageContent({
  products
}: {
  products: SavingsProductListItem[];
}) {
  return (
    <ListPage
      title="Deposit products"
      description="Deposit product definitions used when opening new savings accounts."
      actions={
        <Can permission="CREATE_SAVINGSPRODUCT">
          <Link href={savingsProductCreatePath()} className={cn(buttonVariants())}>
            Create deposit product
          </Link>
        </Can>
      }
    >
      <SavingsProductsTable products={products} />
    </ListPage>
  );
}

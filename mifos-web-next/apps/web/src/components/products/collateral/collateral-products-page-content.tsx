'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { CollateralProductsTable } from '@/components/products/collateral/collateral-products-table';
import { buttonVariants } from '@/components/ui/button';
import { collateralProductCreatePath } from '@/lib/fineract/collateral-product-paths';
import { cn } from '@/lib/utils';

export function CollateralProductsPageContent({
  products
}: {
  products: CollateralProductListItem[];
}) {
  return (
    <ListPage
      title="Collateral products"
      description="Collateral types and valuation rules used when registering client collateral and loan security."
      actions={
        <Can permission="CREATE_COLLATERAL">
          <Link href={collateralProductCreatePath()} className={cn(buttonVariants())}>
            Create collateral product
          </Link>
        </Can>
      }
    >
      <CollateralProductsTable products={products} />
    </ListPage>
  );
}

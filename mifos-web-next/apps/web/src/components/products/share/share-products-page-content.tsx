'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { ShareProductsTable } from '@/components/products/share/share-products-table';
import { buttonVariants } from '@/components/ui/button';
import { shareProductCreatePath } from '@/lib/fineract/share-product-paths';
import { cn } from '@/lib/utils';

export function ShareProductsPageContent({
  products
}: {
  products: ShareProductListItem[];
}) {
  return (
    <ListPage
      title="Share products"
      description="Share product definitions used when opening new share accounts."
      actions={
        <Can permission="CREATE_SHAREPRODUCT">
          <Link href={shareProductCreatePath()} className={cn(buttonVariants())}>
            Create share product
          </Link>
        </Can>
      }
    >
      <ShareProductsTable products={products} />
    </ListPage>
  );
}

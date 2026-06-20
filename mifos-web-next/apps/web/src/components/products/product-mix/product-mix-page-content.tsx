'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { ProductMixTable } from '@/components/products/product-mix/product-mix-table';
import { buttonVariants } from '@/components/ui/button';
import { productMixCreatePath } from '@/lib/fineract/product-mix-paths';
import { cn } from '@/lib/utils';

export function ProductMixPageContent({ mixes }: { mixes: ProductMixListItem[] }) {
  return (
    <ListPage
      title="Product mix"
      description="Define which loan products cannot be held together by the same customer."
      actions={
        <Can permission="CREATE_PRODUCTMIX">
          <Link href={productMixCreatePath()} className={cn(buttonVariants())}>
            Create product mix
          </Link>
        </Can>
      }
    >
      <ProductMixTable mixes={mixes} />
    </ListPage>
  );
}

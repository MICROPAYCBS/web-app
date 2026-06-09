'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductKind, DepositProductListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { DepositProductsTable } from '@/components/products/deposit/deposit-products-table';
import { buttonVariants } from '@/components/ui/button';
import {
  depositProductConfig,
  depositProductCreatePath
} from '@/lib/fineract/deposit-product-config';
import { cn } from '@/lib/utils';

export function DepositProductsPageContent({
  kind,
  products
}: {
  kind: DepositProductKind;
  products: DepositProductListItem[];
}) {
  const config = depositProductConfig(kind);
  const createPermission =
    kind === 'recurring' ? 'CREATE_RECURRINGDEPOSITPRODUCT' : 'CREATE_FIXEDDEPOSITPRODUCT';

  return (
    <ListPage
      title={config.labelPlural}
      description={config.listDescription}
      actions={
        <Can permission={createPermission}>
          <Link href={depositProductCreatePath(kind)} className={cn(buttonVariants())}>
            {config.createButtonLabel}
          </Link>
        </Can>
      }
    >
      <DepositProductsTable kind={kind} products={products} />
    </ListPage>
  );
}

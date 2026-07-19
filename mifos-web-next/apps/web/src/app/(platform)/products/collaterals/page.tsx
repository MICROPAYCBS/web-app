/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CollateralProductsPageClient } from '@/components/products/collateral/collateral-products-page-client';
import {
  getCollateralProductFormTemplate,
  listCollateralProducts
} from '@/lib/fineract/collateral-products';
import { getServerSession } from '@/lib/session/server';

export default async function CollateralProductsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.collaterals'))) {
    notFound();
  }

  const [products, template] = await Promise.all([
    listCollateralProducts(),
    getCollateralProductFormTemplate()
  ]);

  return (
    <Suspense fallback={null}>
      <CollateralProductsPageClient
        products={products}
        template={template}
        canCreate={can(session, resolvePermission('products.collaterals.create'))}
      />
    </Suspense>
  );
}

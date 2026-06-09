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
import { CollateralProductDetailPageClient } from '@/components/products/collateral/collateral-product-detail-page-client';
import {
  getCollateralProduct,
  getCollateralProductFormTemplate
} from '@/lib/fineract/collateral-products';
import { collateralProductCurrencyCode } from '@/lib/fineract/collateral-product-display';
import { getServerSession } from '@/lib/session/server';

export default async function CollateralProductDetailPage({
  params
}: {
  params: Promise<{ collateralId: string }>;
}) {
  const { collateralId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.collaterals'))) {
    notFound();
  }

  let product;
  try {
    product = await getCollateralProduct(collateralId);
  } catch {
    notFound();
  }

  const template = await getCollateralProductFormTemplate(
    collateralProductCurrencyCode(product.currency)
  );
  const canEdit = can(session, resolvePermission('products.collaterals.update'));

  return (
    <Suspense fallback={null}>
      <CollateralProductDetailPageClient
        product={product}
        template={template}
        canEdit={canEdit}
        canDelete={can(session, resolvePermission('products.collaterals.delete'))}
      />
    </Suspense>
  );
}

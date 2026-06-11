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
import { ProductMixDetailPageClient } from '@/components/products/product-mix/product-mix-detail-page-client';
import { getProductMix, listProductMixes } from '@/lib/fineract/product-mix';
import { getServerSession } from '@/lib/session/server';

export default async function ProductMixDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.mix'))) {
    notFound();
  }

  const listItem = (await listProductMixes()).find(
    (item) => String(item.productId) === productId
  );

  let mix;
  try {
    mix = await getProductMix(productId, listItem?.productName);
  } catch {
    notFound();
  }

  const canEdit = can(session, resolvePermission('products.mix.update'));

  return (
    <Suspense fallback={null}>
      <ProductMixDetailPageClient
        mix={mix}
        canEdit={canEdit}
        canDelete={can(session, resolvePermission('products.mix.delete'))}
      />
    </Suspense>
  );
}

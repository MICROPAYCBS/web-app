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
import { SavingsProductDetailView } from '@/components/products/savings/savings-product-detail-view';
import { getSavingsProduct } from '@/lib/fineract/savings-products';
import { getServerSession } from '@/lib/session/server';

export default async function SavingsProductDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.savings'))) {
    notFound();
  }

  const { productId } = await params;

  let product;
  try {
    product = await getSavingsProduct(productId);
  } catch {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <SavingsProductDetailView product={product} />
      </Suspense>
    </div>
  );
}

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
import { DepositProductDetailView } from '@/components/products/deposit/deposit-product-detail-view';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { getDepositProduct } from '@/lib/fineract/deposit-products';
import { getServerSession } from '@/lib/session/server';

export default async function FixedDepositProductDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.fixedDeposit'))) {
    notFound();
  }

  const { productId } = await params;

  let product;
  try {
    product = await getDepositProduct('fixed', productId);
  } catch {
    notFound();
  }

  return (
    <PlatformRouteLayout>
      <Suspense fallback={null}>
        <DepositProductDetailView kind="fixed" product={product} />
      </Suspense>
    </PlatformRouteLayout>
  );
}

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
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { LoanProductDetailView } from '@/components/products/loan/loan-product-detail-view';
import { getLoanProduct } from '@/lib/fineract/loan-products';
import { parseLoanProductKind } from '@/lib/fineract/loan-product-paths';
import { getServerSession } from '@/lib/session/server';

export default async function LoanProductDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ productType?: string; section?: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.loan'))) {
    notFound();
  }

  const { productId } = await params;
  const { productType } = await searchParams;
  const kind = parseLoanProductKind(productType);

  let product;
  try {
    product = await getLoanProduct(productId, kind);
  } catch {
    notFound();
  }

  return (
    <PlatformRouteLayout>
      <Suspense fallback={null}>
        <LoanProductDetailView product={product} productKind={kind} />
      </Suspense>
    </PlatformRouteLayout>
  );
}

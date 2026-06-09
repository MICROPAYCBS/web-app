/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { FineractHttpError } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ShareProductDetailView } from '@/components/products/share/share-product-detail-view';
import { getShareProduct } from '@/lib/fineract/share-products';
import { getServerSession } from '@/lib/session/server';

export default async function ShareProductDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.share'))) {
    notFound();
  }

  const { productId } = await params;

  let product;
  try {
    product = await getShareProduct(productId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <ShareProductDetailView product={product} />
      </Suspense>
    </div>
  );
}

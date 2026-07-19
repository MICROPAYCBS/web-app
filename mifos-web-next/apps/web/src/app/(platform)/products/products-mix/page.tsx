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
import { ProductMixPageClient } from '@/components/products/product-mix/product-mix-page-client';
import {
  getProductMixCreateTemplate,
  listProductMixes
} from '@/lib/fineract/product-mix';
import { getServerSession } from '@/lib/session/server';

export default async function ProductMixPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.mix'))) {
    notFound();
  }

  const [mixes, template] = await Promise.all([
    listProductMixes(),
    getProductMixCreateTemplate()
  ]);

  return (
    <Suspense fallback={null}>
      <ProductMixPageClient
        mixes={mixes}
        template={template}
        canCreate={can(session, resolvePermission('products.mix.create'))}
      />
    </Suspense>
  );
}

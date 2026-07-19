/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ShareProductsPageContent } from '@/components/products/share/share-products-page-content';
import { listShareProducts } from '@/lib/fineract/share-products';
import { getServerSession } from '@/lib/session/server';

export default async function ShareProductsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.share'))) {
    notFound();
  }

  const products = await listShareProducts();

  return <ShareProductsPageContent products={products} />;
}

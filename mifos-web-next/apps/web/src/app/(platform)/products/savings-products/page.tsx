/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SavingsProductsPageContent } from '@/components/products/savings/savings-products-page-content';
import { listSavingsProducts } from '@/lib/fineract/savings-products';
import { getServerSession } from '@/lib/session/server';

export default async function SavingsProductsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.savings'))) {
    notFound();
  }

  const products = await listSavingsProducts();

  return <SavingsProductsPageContent products={products} />;
}

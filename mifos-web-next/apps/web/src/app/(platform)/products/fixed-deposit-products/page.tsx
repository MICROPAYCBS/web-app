/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DepositProductsPageContent } from '@/components/products/deposit/deposit-products-page-content';
import { listDepositProducts } from '@/lib/fineract/deposit-products';
import { getServerSession } from '@/lib/session/server';

export default async function FixedDepositProductsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.fixedDeposit'))) {
    notFound();
  }

  const products = await listDepositProducts('fixed');

  return <DepositProductsPageContent kind="fixed" products={products} />;
}

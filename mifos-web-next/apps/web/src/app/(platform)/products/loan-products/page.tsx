/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LoanProductsPageContent } from '@/components/products/loan/loan-products-page-content';
import { listLoanProducts } from '@/lib/fineract/loan-products';
import { parseLoanProductKind } from '@/lib/fineract/loan-product-paths';
import { getServerSession } from '@/lib/session/server';

export default async function LoanProductsPage({
  searchParams
}: {
  searchParams: Promise<{ productType?: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.loan'))) {
    notFound();
  }

  const { productType } = await searchParams;
  const kind = parseLoanProductKind(productType);
  const products = await listLoanProducts(kind);

  return <LoanProductsPageContent products={products} productKind={kind} />;
}

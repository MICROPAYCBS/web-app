/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ProductListPageSkeleton } from '@/components/products/shared/product-page-skeletons';

export default function SavingsProductsLoading() {
  return (
    <ProductListPageSkeleton
      title="Deposit products"
      description="Deposit product definitions used when opening new savings accounts."
    />
  );
}

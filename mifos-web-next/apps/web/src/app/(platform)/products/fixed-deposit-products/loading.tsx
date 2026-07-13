/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ProductListPageSkeleton } from '@/components/products/shared/product-page-skeletons';
import { FIXED_DEPOSIT_CONFIG } from '@/lib/fineract/deposit-product-config';

export default function FixedDepositProductsLoading() {
  return (
    <ProductListPageSkeleton
      title={FIXED_DEPOSIT_CONFIG.labelPlural}
      description={FIXED_DEPOSIT_CONFIG.listDescription}
    />
  );
}

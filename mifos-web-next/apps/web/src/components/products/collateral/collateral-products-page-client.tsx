'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductListItem, CollateralProductTemplate } from '@mifos/api-client';
import { CollateralProductsPageContent } from '@/components/products/collateral/collateral-products-page-content';
import { CollateralProductCreateUrlPanel } from '@/components/products/collateral/collateral-product-create-url-panel';

export function CollateralProductsPageClient({
  products,
  template,
  canCreate
}: {
  products: CollateralProductListItem[];
  template: CollateralProductTemplate;
  canCreate: boolean;
}) {
  return (
    <>
      <CollateralProductsPageContent products={products} />
      {canCreate ? <CollateralProductCreateUrlPanel template={template} /> : null}
    </>
  );
}

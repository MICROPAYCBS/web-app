'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductDetail, CollateralProductTemplate } from '@mifos/api-client';
import { CollateralProductDetailView } from '@/components/products/collateral/collateral-product-detail-view';
import { CollateralProductEditUrlPanel } from '@/components/products/collateral/collateral-product-edit-url-panel';

export function CollateralProductDetailPageClient({
  product,
  template,
  canEdit,
  canDelete
}: {
  product: CollateralProductDetail;
  template: CollateralProductTemplate;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <CollateralProductDetailView
        product={product}
        canEdit={canEdit}
        canDelete={canDelete}
      />
      {canEdit ? (
        <CollateralProductEditUrlPanel product={product} template={template} />
      ) : null}
    </>
  );
}

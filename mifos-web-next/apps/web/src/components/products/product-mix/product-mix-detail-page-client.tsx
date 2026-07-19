'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixDetail } from '@mifos/api-client';
import { ProductMixDetailView } from '@/components/products/product-mix/product-mix-detail-view';
import { ProductMixEditUrlPanel } from '@/components/products/product-mix/product-mix-edit-url-panel';

export function ProductMixDetailPageClient({
  mix,
  canEdit,
  canDelete
}: {
  mix: ProductMixDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ProductMixDetailView mix={mix} canEdit={canEdit} canDelete={canDelete} />
      {canEdit ? <ProductMixEditUrlPanel mix={mix} /> : null}
    </>
  );
}

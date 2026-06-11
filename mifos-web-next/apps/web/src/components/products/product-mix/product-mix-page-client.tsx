'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixCreateTemplate, ProductMixListItem } from '@mifos/api-client';
import { ProductMixCreateUrlPanel } from '@/components/products/product-mix/product-mix-create-url-panel';
import { ProductMixPageContent } from '@/components/products/product-mix/product-mix-page-content';

export function ProductMixPageClient({
  mixes,
  template,
  canCreate
}: {
  mixes: ProductMixListItem[];
  template: ProductMixCreateTemplate;
  canCreate: boolean;
}) {
  return (
    <>
      <ProductMixPageContent mixes={mixes} />
      {canCreate ? <ProductMixCreateUrlPanel template={template} /> : null}
    </>
  );
}

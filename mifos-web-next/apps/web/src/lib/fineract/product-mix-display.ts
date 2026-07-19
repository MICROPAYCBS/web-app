/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixDetail, ProductMixProductOption } from '@mifos/api-client';

export function productMixSelectableOptions(detail: ProductMixDetail): ProductMixProductOption[] {
  const byId = new Map<number, ProductMixProductOption>();
  for (const product of [...detail.restrictedProducts, ...detail.allowedProducts]) {
    byId.set(product.id, product);
  }
  return [...byId.values()].sort((a, b) =>
    (a.name ?? String(a.id)).localeCompare(b.name ?? String(b.id))
  );
}

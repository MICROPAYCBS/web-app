/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductDetail, ShareProductSectionId } from '@mifos/api-client';
import { isProductAccountingEnabled } from '@/lib/fineract/product-display';

export const SHARE_PRODUCT_DEFAULT_SECTION: ShareProductSectionId = 'general';

export interface ProductSectionDefinition {
  id: ShareProductSectionId;
  label: string;
}

export function shareProductCurrencyCode(product: ShareProductDetail): string {
  return product.currency?.code ?? product.currencyCode ?? 'USD';
}

export function shareProductFeeCharges(product: ShareProductDetail) {
  return product.charges ?? [];
}

export function shareProductSections(product: ShareProductDetail): ProductSectionDefinition[] {
  const items: ProductSectionDefinition[] = [
    { id: 'general', label: 'General' },
    { id: 'terms', label: 'Terms' }
  ];

  if ((product.marketPrice?.length ?? 0) > 0) {
    items.push({ id: 'marketPrice', label: 'Market price' });
  }
  if (shareProductFeeCharges(product).length > 0) {
    items.push({ id: 'fees', label: 'Fees' });
  }
  if (isProductAccountingEnabled(product.accountingRule)) {
    items.push({ id: 'accounting', label: 'Accounting' });
  }

  return items;
}

export function shareProductSectionIds(product: ShareProductDetail): string[] {
  return shareProductSections(product).map((item) => item.id);
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductDetail, SavingsProductSectionId } from '@mifos/api-client';
import { isProductAccountingEnabled } from '@/lib/fineract/product-display';

export const SAVINGS_PRODUCT_DEFAULT_SECTION: SavingsProductSectionId = 'general';

export interface ProductSectionDefinition {
  id: SavingsProductSectionId;
  label: string;
}

export function savingsProductCurrencyCode(product: SavingsProductDetail): string {
  return product.currency?.code ?? 'USD';
}

export function savingsProductFeeCharges(product: SavingsProductDetail) {
  return (product.charges ?? []).filter((charge) => charge.penalty !== true);
}

export function savingsProductHasChannelMappings(product: SavingsProductDetail): boolean {
  return (product.paymentChannelToFundSourceMappings?.length ?? 0) > 0;
}

export function savingsProductHasFeeGlMappings(product: SavingsProductDetail): boolean {
  return (product.feeToIncomeAccountMappings?.length ?? 0) > 0;
}

export function savingsProductHasPenaltyGlMappings(product: SavingsProductDetail): boolean {
  return (product.penaltyToIncomeAccountMappings?.length ?? 0) > 0;
}

export function savingsProductSections(product: SavingsProductDetail): ProductSectionDefinition[] {
  const items: ProductSectionDefinition[] = [
    { id: 'general', label: 'General' },
    { id: 'terms', label: 'Terms' }
  ];

  if (savingsProductFeeCharges(product).length > 0) {
    items.push({ id: 'fees', label: 'Fees' });
  }
  if (isProductAccountingEnabled(product.accountingRule)) {
    items.push({ id: 'accounting', label: 'Accounting' });
  }
  if (savingsProductHasChannelMappings(product)) {
    items.push({ id: 'channelMapping', label: 'Channel mapping' });
  }
  if (savingsProductHasFeeGlMappings(product)) {
    items.push({ id: 'feeGlMappings', label: 'Fee GL mappings' });
  }
  if (savingsProductHasPenaltyGlMappings(product)) {
    items.push({ id: 'penaltyGlMappings', label: 'Penalty GL mappings' });
  }

  return items;
}

export function savingsProductSectionIds(product: SavingsProductDetail): string[] {
  return savingsProductSections(product).map((item) => item.id);
}

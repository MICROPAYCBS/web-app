/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductDetail, DepositProductSectionId } from '@mifos/api-client';
import { isProductAccountingEnabled } from '@/lib/fineract/product-display';

export const DEPOSIT_PRODUCT_DEFAULT_SECTION: DepositProductSectionId = 'general';

export interface ProductSectionDefinition {
  id: DepositProductSectionId;
  label: string;
}

export function depositProductCurrencyCode(product: DepositProductDetail): string {
  return product.currency?.code ?? product.currencyCode ?? '—';
}

export function depositProductFeeCharges(product: DepositProductDetail) {
  return (product.charges ?? []).filter((charge) => charge.penalty !== true);
}

export function depositProductPenaltyCharges(product: DepositProductDetail) {
  return (product.charges ?? []).filter((charge) => charge.penalty === true);
}

export function depositProductHasCharges(product: DepositProductDetail): boolean {
  return (
    depositProductFeeCharges(product).length > 0 ||
    depositProductPenaltyCharges(product).length > 0
  );
}

export function depositProductHasChannelMappings(product: DepositProductDetail): boolean {
  return (product.paymentChannelToFundSourceMappings?.length ?? 0) > 0;
}

export function depositProductHasFeeGlMappings(product: DepositProductDetail): boolean {
  return (product.feeToIncomeAccountMappings?.length ?? 0) > 0;
}

export function depositProductHasPenaltyGlMappings(product: DepositProductDetail): boolean {
  return (product.penaltyToIncomeAccountMappings?.length ?? 0) > 0;
}

export function depositProductSections(product: DepositProductDetail): ProductSectionDefinition[] {
  const items: ProductSectionDefinition[] = [
    { id: 'general', label: 'General' },
    { id: 'terms', label: 'Terms' },
    // FD/RD products always expose the chart section (empty state when none configured).
    { id: 'chart', label: 'Interest rate chart' }
  ];

  if (depositProductHasCharges(product)) {
    items.push({ id: 'fees', label: 'Fees' });
  }
  if (isProductAccountingEnabled(product.accountingRule)) {
    items.push({ id: 'accounting', label: 'Accounting' });
  }
  if (depositProductHasChannelMappings(product)) {
    items.push({ id: 'channelMapping', label: 'Channel mapping' });
  }
  if (depositProductHasFeeGlMappings(product)) {
    items.push({ id: 'feeGlMappings', label: 'Fee GL mappings' });
  }
  if (depositProductHasPenaltyGlMappings(product)) {
    items.push({ id: 'penaltyGlMappings', label: 'Penalty GL mappings' });
  }

  return items;
}

export function depositProductSectionIds(product: DepositProductDetail): string[] {
  return depositProductSections(product).map((item) => item.id);
}

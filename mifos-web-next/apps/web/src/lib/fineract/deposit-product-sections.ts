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

export function depositProductHasChart(product: DepositProductDetail): boolean {
  const chart = product.activeChart;
  if (!chart) {
    return false;
  }
  return Array.isArray(chart) ? chart.length > 0 : true;
}

export function depositProductSections(product: DepositProductDetail): ProductSectionDefinition[] {
  const items: ProductSectionDefinition[] = [
    { id: 'general', label: 'General' },
    { id: 'terms', label: 'Terms' }
  ];

  if (depositProductHasChart(product)) {
    items.push({ id: 'chart', label: 'Interest rate chart' });
  }
  if (depositProductHasCharges(product)) {
    items.push({ id: 'fees', label: 'Fees' });
  }
  if (isProductAccountingEnabled(product.accountingRule)) {
    items.push({ id: 'accounting', label: 'Accounting' });
  }

  return items;
}

export function depositProductSectionIds(product: DepositProductDetail): string[] {
  return depositProductSections(product).map((item) => item.id);
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  LoanProductDetail,
  LoanProductKind,
  LoanProductSectionId
} from '@mifos/api-client';
import { isProductAccountingEnabled } from '@/lib/fineract/product-display';

export const LOAN_PRODUCT_DEFAULT_SECTION: LoanProductSectionId = 'general';

export interface ProductSectionDefinition {
  id: LoanProductSectionId;
  label: string;
}

export function loanProductCurrencyCode(product: LoanProductDetail): string {
  return product.currency?.code ?? product.currencyCode ?? 'USD';
}

export function loanProductFeeCharges(product: LoanProductDetail) {
  return (product.charges ?? []).filter((charge) => charge.penalty !== true);
}

export function loanProductPenaltyCharges(product: LoanProductDetail) {
  return (product.charges ?? []).filter((charge) => charge.penalty === true);
}

export function loanProductHasMappings(product: LoanProductDetail): boolean {
  return (
    (product.paymentChannelToFundSourceMappings?.length ?? 0) > 0 ||
    (product.feeToIncomeAccountMappings?.length ?? 0) > 0 ||
    (product.penaltyToIncomeAccountMappings?.length ?? 0) > 0
  );
}

export function loanProductSections(
  product: LoanProductDetail,
  _kind: LoanProductKind
): ProductSectionDefinition[] {
  const items: ProductSectionDefinition[] = [
    { id: 'general', label: 'General' },
    { id: 'terms', label: 'Terms' },
    { id: 'settings', label: 'Settings' }
  ];

  if (loanProductFeeCharges(product).length > 0) {
    items.push({ id: 'fees', label: 'Fees' });
  }
  if (loanProductPenaltyCharges(product).length > 0) {
    items.push({ id: 'penalties', label: 'Penalties' });
  }
  if (isProductAccountingEnabled(product.accountingRule)) {
    items.push({ id: 'accounting', label: 'Accounting' });
  }
  if (loanProductHasMappings(product)) {
    items.push({ id: 'mappings', label: 'Channel mappings' });
  }

  return items;
}

export function loanProductSectionIds(product: LoanProductDetail, kind: LoanProductKind): string[] {
  return loanProductSections(product, kind).map((item) => item.id);
}

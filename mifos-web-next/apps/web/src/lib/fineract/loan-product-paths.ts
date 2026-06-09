/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind } from '@mifos/api-client';

export const LOAN_PRODUCT_KIND = {
  LOAN: 'loan',
  WORKING_CAPITAL: 'working-capital'
} as const satisfies Record<string, LoanProductKind>;

export function parseLoanProductKind(value: string | undefined): LoanProductKind {
  if (value === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
    return LOAN_PRODUCT_KIND.WORKING_CAPITAL;
  }
  return LOAN_PRODUCT_KIND.LOAN;
}

export function loanProductApiPath(kind: LoanProductKind): string {
  return kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL
    ? '/working-capital-loan-products'
    : '/loanproducts';
}

export function loanProductListPath(kind: LoanProductKind): string {
  if (kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
    return '/products/loan-products?productType=working-capital';
  }
  return '/products/loan-products';
}

export function loanProductDetailPath(productId: string | number, kind: LoanProductKind): string {
  const base = `/products/loan-products/${productId}`;
  if (kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
    return `${base}?productType=working-capital`;
  }
  return base;
}

export function loanProductKindLabel(kind: LoanProductKind): string {
  return kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL ? 'Working capital' : 'Loan';
}

export function loanProductCreatePath(kind: LoanProductKind): string {
  if (kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
    return '/products/loan-products/create?productType=working-capital';
  }
  return '/products/loan-products/create';
}

export function loanProductEditPath(
  productId: string | number,
  kind: LoanProductKind
): string {
  const base = `/products/loan-products/${productId}/edit`;
  if (kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
    return `${base}?productType=working-capital`;
  }
  return base;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductKind } from '@mifos/api-client';

export interface DepositProductKindConfig {
  kind: DepositProductKind;
  apiPath: string;
  listPath: string;
  permissionKey: string;
  permissionCreateKey: string;
  permissionUpdateKey: string;
  label: string;
  labelPlural: string;
  createButtonLabel: string;
  createPageTitle: string;
  editPageTitle: string;
  listDescription: string;
  isRecurring: boolean;
}

export const RECURRING_DEPOSIT_CONFIG: DepositProductKindConfig = {
  kind: 'recurring',
  apiPath: '/recurringdepositproducts',
  listPath: '/products/recurring-deposit-products',
  permissionKey: 'products.recurringDeposit',
  permissionCreateKey: 'products.recurringDeposit.create',
  permissionUpdateKey: 'products.recurringDeposit.update',
  label: 'Recurring deposit product',
  labelPlural: 'Recurring deposit products',
  createButtonLabel: 'Create recurring deposit product',
  createPageTitle: 'Create recurring deposit product',
  editPageTitle: 'Edit recurring deposit product',
  listDescription:
    'Recurring deposit product definitions used when opening new recurring deposit accounts.',
  isRecurring: true
};

export const FIXED_DEPOSIT_CONFIG: DepositProductKindConfig = {
  kind: 'fixed',
  apiPath: '/fixeddepositproducts',
  listPath: '/products/fixed-deposit-products',
  permissionKey: 'products.fixedDeposit',
  permissionCreateKey: 'products.fixedDeposit.create',
  permissionUpdateKey: 'products.fixedDeposit.update',
  label: 'Fixed deposit product',
  labelPlural: 'Fixed deposit products',
  createButtonLabel: 'Create fixed deposit product',
  createPageTitle: 'Create fixed deposit product',
  editPageTitle: 'Edit fixed deposit product',
  listDescription:
    'Fixed deposit product definitions used when opening new fixed deposit accounts.',
  isRecurring: false
};

export const DEPOSIT_PRODUCT_CONFIGS: Record<DepositProductKind, DepositProductKindConfig> = {
  recurring: RECURRING_DEPOSIT_CONFIG,
  fixed: FIXED_DEPOSIT_CONFIG
};

export function depositProductConfig(kind: DepositProductKind): DepositProductKindConfig {
  return DEPOSIT_PRODUCT_CONFIGS[kind];
}

export function depositProductDetailPath(
  kind: DepositProductKind,
  productId: string | number
): string {
  return `${depositProductConfig(kind).listPath}/${productId}`;
}

export function depositProductCreatePath(kind: DepositProductKind): string {
  return `${depositProductConfig(kind).listPath}/create`;
}

export function depositProductEditPath(
  kind: DepositProductKind,
  productId: string | number
): string {
  return `${depositProductConfig(kind).listPath}/${productId}/edit`;
}

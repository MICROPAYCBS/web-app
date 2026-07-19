/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ProvisioningCriteriaGlAccount,
  ProvisioningCriteriaLoanProduct
} from '@mifos/api-client';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';

export function mergeProvisioningLoanProductOptions(
  available: ProvisioningCriteriaLoanProduct[],
  selected: ProvisioningCriteriaLoanProduct[] = []
): ProvisioningCriteriaLoanProduct[] {
  const byId = new Map<number, ProvisioningCriteriaLoanProduct>();
  for (const product of [...available, ...selected]) {
    byId.set(product.id, product);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatProvisioningLoanProducts(
  products: ProvisioningCriteriaLoanProduct[] | undefined
): string {
  if (!products?.length) {
    return '—';
  }
  return products.map((product) => product.name).join(', ');
}

export function filterProvisioningGlAccounts(
  accounts: ProvisioningCriteriaGlAccount[] | undefined,
  type: 'LIABILITY' | 'EXPENSE'
): ProvisioningCriteriaGlAccount[] {
  return (accounts ?? []).filter((account) => account.type?.value === type);
}

export function provisioningGlAccountLabel(account: ProvisioningCriteriaGlAccount): string {
  return formatGlAccountLabel(account);
}

export function resolveProvisioningGlAccountLabel(
  accounts: ProvisioningCriteriaGlAccount[],
  accountId: number | undefined
): string {
  if (accountId == null) {
    return '—';
  }
  const account = accounts.find((item) => item.id === accountId);
  return account ? provisioningGlAccountLabel(account) : String(accountId);
}

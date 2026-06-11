/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractGlAccountRef,
  TaxComponentGlAccountOptions,
  TaxComponentOption,
  TaxComponentTemplate
} from '@mifos/api-client';
import { formatGlAccountLabel, formatGlAccountTypeLabel } from '@/lib/accounting/gl-account-display';
import { fineractApiDateToFormString, formatFineractDateArray } from '@/lib/fineract/dates';

export function formatTaxDate(value: number[] | string | undefined): string {
  return formatFineractDateArray(value) ?? '—';
}

export function taxDateToFormString(value: number[] | string | undefined): string | undefined {
  return fineractApiDateToFormString(value);
}

export function formatTaxAccountType(option: FineractEnumOption | undefined): string {
  return formatGlAccountTypeLabel(option);
}

export function formatTaxGlAccount(account: FineractGlAccountRef | undefined): string {
  if (!account) {
    return '—';
  }
  return formatGlAccountLabel(account);
}

export function glAccountsForTaxComponentType(
  accountTypeId: number | undefined,
  options: TaxComponentGlAccountOptions
): FineractGlAccountRef[] {
  switch (accountTypeId) {
    case 1:
      return options.assetAccountOptions ?? [];
    case 2:
      return options.liabilityAccountOptions ?? [];
    case 3:
      return options.equityAccountOptions ?? [];
    case 4:
      return options.incomeAccountOptions ?? [];
    case 5:
      return options.expenseAccountOptions ?? [];
    default:
      return [];
  }
}

export function taxComponentTypeSelectOptions(template: TaxComponentTemplate) {
  return template.glAccountTypeOptions.map((option) => ({
    value: String(option.id),
    label: formatGlAccountTypeLabel(option)
  }));
}

export function taxGlAccountSelectOptions(accounts: FineractGlAccountRef[]) {
  return accounts.map((account) => ({
    value: String(account.id),
    label: formatGlAccountLabel(account)
  }));
}

export function taxComponentSelectOptions(components: TaxComponentOption[]) {
  return components.map((component) => ({
    value: String(component.id),
    label: component.name ?? `Component #${component.id}`
  }));
}

export function taxComponentName(
  components: TaxComponentOption[],
  taxComponentId: number
): string {
  const match = components.find((component) => component.id === taxComponentId);
  return match?.name ?? `Component #${taxComponentId}`;
}

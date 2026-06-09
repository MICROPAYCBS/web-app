/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountNumberPreferenceDetail,
  FineractAccountNumberPreferenceOption,
  FineractAccountNumberPreferenceTemplate
} from '@mifos/api-client';
import type { UpdateAccountNumberPreferenceInput } from '@mifos/validation';

export function accountNumberPreferenceLabel(
  option: FineractAccountNumberPreferenceOption | undefined
): string {
  if (!option) {
    return '—';
  }
  return option.value || String(option.id);
}

export function prefixTypeOptionsKey(
  accountType: FineractAccountNumberPreferenceOption | undefined
): string | null {
  if (!accountType) {
    return null;
  }
  if (accountType.code) {
    return accountType.code;
  }
  if (!accountType.value) {
    return null;
  }
  return `accountType.${accountType.value.toLowerCase()}`;
}

export function listPrefixTypeOptions(
  template: FineractAccountNumberPreferenceTemplate,
  accountType: FineractAccountNumberPreferenceOption | undefined
): FineractAccountNumberPreferenceOption[] {
  const key = prefixTypeOptionsKey(accountType);
  if (!key) {
    return [];
  }
  return template.prefixTypeOptions[key] ?? [];
}

export function findAccountTypeOption(
  template: FineractAccountNumberPreferenceTemplate,
  accountTypeId: number | undefined
): FineractAccountNumberPreferenceOption | undefined {
  if (!Number.isFinite(accountTypeId)) {
    return undefined;
  }
  return template.accountTypeOptions.find((option) => option.id === accountTypeId);
}

export function preferenceToUpdateValues(
  preference: FineractAccountNumberPreferenceDetail
): UpdateAccountNumberPreferenceInput {
  return {
    prefixType: preference.prefixType?.id
  };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CAPTURE_LEGAL_TENDER_FOR_CASH_TRANSACTIONS_CONFIG_NAME } from '@/lib/fineract/cashier-policy-paths';

export type GlobalConfigurationStringOption = {
  value: string;
  label: string;
};

type GlobalConfigurationStringFieldMeta = {
  /** Field label shown instead of generic "String value". */
  fieldLabel: string;
  options: GlobalConfigurationStringOption[];
};

const GLOBAL_CONFIGURATION_STRING_FIELDS: Record<string, GlobalConfigurationStringFieldMeta> = {
  [CAPTURE_LEGAL_TENDER_FOR_CASH_TRANSACTIONS_CONFIG_NAME]: {
    fieldLabel: 'Legal tender capture mode',
    options: [
      { value: 'OFF', label: 'Off — amount only' },
      { value: 'OPTIONAL', label: 'Optional — amount or denominations' },
      { value: 'REQUIRED', label: 'Required — denominations only' }
    ]
  }
};

export function globalConfigurationStringValueField(
  configurationName: string | null | undefined
): GlobalConfigurationStringFieldMeta | null {
  const name = configurationName?.trim();
  if (!name) {
    return null;
  }
  return GLOBAL_CONFIGURATION_STRING_FIELDS[name] ?? null;
}

export function isKnownGlobalConfigurationStringValue(
  configurationName: string | null | undefined,
  stringValue: string | null | undefined
): boolean {
  const field = globalConfigurationStringValueField(configurationName);
  if (!field) {
    return true;
  }
  const normalized = stringValue?.trim().toUpperCase();
  if (!normalized) {
    return false;
  }
  return field.options.some((option) => option.value === normalized);
}

export function normalizeGlobalConfigurationStringValue(
  configurationName: string | null | undefined,
  stringValue: string | null | undefined
): string {
  const field = globalConfigurationStringValueField(configurationName);
  const trimmed = stringValue?.trim() ?? '';
  if (!field) {
    return trimmed;
  }
  const normalized = trimmed.toUpperCase();
  const match = field.options.find((option) => option.value === normalized);
  return match?.value ?? trimmed;
}

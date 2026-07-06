/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { fineractApiDateToFormString, formatFineractDateArray } from '@/lib/fineract/dates';
import { ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME } from '@/lib/fineract/loan-repayment-policy-paths';

const GLOBAL_CONFIGURATION_DISPLAY_NAMES: Record<string, string> = {
  [ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME]: 'Allow direct loan repayments'
};

export function globalConfigurationDisplayName(name: string): string {
  return GLOBAL_CONFIGURATION_DISPLAY_NAMES[name] ?? name;
}

export function formatGlobalConfigurationValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return String(value);
}

export function formatGlobalConfigurationStringValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

export function formatGlobalConfigurationDateValue(
  value: string | number[] | null | undefined
): string {
  if (value == null) {
    return '—';
  }
  return formatFineractDateArray(value) ?? '—';
}

export function globalConfigurationToEditValues(
  configuration: FineractGlobalConfiguration
): {
  value: string;
  stringValue: string;
  dateValue: string;
} {
  return {
    value:
      configuration.value == null || Number.isNaN(configuration.value)
        ? ''
        : String(configuration.value),
    stringValue: configuration.stringValue?.trim() ?? '',
    dateValue:
      configuration.dateValue == null
        ? ''
        : (fineractApiDateToFormString(configuration.dateValue) ?? '')
  };
}

export function applyGlobalConfigurationChanges(
  configuration: FineractGlobalConfiguration,
  changes: {
    enabled?: boolean;
    value?: number | null;
    stringValue?: string | null;
    dateValue?: string | null;
  }
): FineractGlobalConfiguration {
  return {
    ...configuration,
    enabled: changes.enabled ?? configuration.enabled,
    value: changes.value !== undefined ? changes.value : configuration.value,
    stringValue:
      changes.stringValue !== undefined ? changes.stringValue : configuration.stringValue,
    dateValue: changes.dateValue !== undefined ? changes.dateValue : configuration.dateValue
  };
}

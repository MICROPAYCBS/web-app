/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { fineractApiDateToFormString, formatFineractDateArray } from '@/lib/fineract/dates';
import {
  ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME,
  STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME
} from '@/lib/fineract/gl-account-code-policy-paths';
import { ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME } from '@/lib/fineract/loan-repayment-policy-paths';
import { ENABLE_ORGANIZATION_WIDE_AUDIT_VIEW_CONFIG_NAME } from '@/lib/fineract/organization-wide-audit-policy-paths';

const GLOBAL_CONFIGURATION_DISPLAY_NAMES: Record<string, string> = {
  [ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME]: 'Allow direct loan repayments',
  [ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME]: 'Enforce structured GL codes',
  [STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME]: 'Structured GL code length',
  [ENABLE_ORGANIZATION_WIDE_AUDIT_VIEW_CONFIG_NAME]: 'Organization-wide audit view'
};

const GLOBAL_CONFIGURATION_DESCRIPTIONS: Record<string, string> = {
  [ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME]:
    'Savings-account transfer is always available and is the preferred way to repay. When this setting is on, staff may also post repayments directly on the loan (cash, bank, etc.). When off, only savings transfer is permitted (direct API calls are rejected).',
  [ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME]:
    'When enabled, new and updated GL accounts must use a fixed-length numeric code whose first digit matches the account class (1=Asset through 5=Expense). Existing codes are grandfathered until code or type is changed.',
  [STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME]:
    'Number of digits required for GL codes when structured enforcement is enabled. The first digit is reserved for the account class; remaining digits are institution-defined.',
  [ENABLE_ORGANIZATION_WIDE_AUDIT_VIEW_CONFIG_NAME]:
    'When enabled, users with READ_AUDIT and VIEW_ORGANIZATION_AUDIT can browse audit trails across all branches. Maker-checker inbox remains limited to the user branch.'
};

export function globalConfigurationDisplayName(name: string): string {
  return GLOBAL_CONFIGURATION_DISPLAY_NAMES[name] ?? name;
}

export function globalConfigurationDescription(
  configuration: FineractGlobalConfiguration
): string | null {
  const fromApi = configuration.description?.trim();
  if (fromApi) {
    return fromApi;
  }
  return GLOBAL_CONFIGURATION_DESCRIPTIONS[configuration.name] ?? null;
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

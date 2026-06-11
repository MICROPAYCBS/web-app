/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractFinancialActivityGlAccountOptions,
  FineractFinancialActivityGlAccountRef,
  FineractFinancialActivityMappingEditData,
  FineractFinancialActivityMappingFormTemplate,
  FineractFinancialActivityMappingListItem,
  FineractFinancialActivityRef
} from '@mifos/api-client';
import type { UpsertFinancialActivityMappingFormInput } from '@mifos/validation';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';

const FINANCIAL_ACTIVITY_LABELS: Record<string, string> = {
  assetTransfer: 'Asset transfer',
  cashAtMainVault: 'Cash at main vault',
  cashAtTeller: 'Cash at teller',
  fundSource: 'Fund source',
  liabilityTransfer: 'Liability transfer',
  openingBalancesTransferContra: 'Opening balances transfer contra',
  payableDividends: 'Payable dividends'
};

const GL_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity'
};

export function formatFinancialActivityLabel(activity: FineractFinancialActivityRef) {
  const label = FINANCIAL_ACTIVITY_LABELS[activity.name];
  if (label) {
    return `(${activity.id}) ${label}`;
  }
  return `(${activity.id}) ${activity.name}`;
}

export function formatFinancialActivityNameOnly(activity: FineractFinancialActivityRef) {
  return FINANCIAL_ACTIVITY_LABELS[activity.name] ?? activity.name;
}

export function formatMappedGlAccountTypeLabel(mappedGLAccountType: string | undefined) {
  if (!mappedGLAccountType) {
    return '—';
  }
  return GL_ACCOUNT_TYPE_LABELS[mappedGLAccountType] ?? mappedGLAccountType;
}

export function formatFinancialActivityGlAccountLabel(
  account: FineractFinancialActivityGlAccountRef
) {
  return formatGlAccountLabel(account);
}

export function glAccountsForFinancialActivity(
  financialActivityId: number,
  glAccountOptions: FineractFinancialActivityGlAccountOptions
): FineractFinancialActivityGlAccountRef[] {
  if ([100, 101, 102, 103].includes(financialActivityId)) {
    return glAccountOptions.assetAccountOptions;
  }
  if ([200, 201].includes(financialActivityId)) {
    return glAccountOptions.liabilityAccountOptions;
  }
  if (financialActivityId === 300) {
    return glAccountOptions.equityAccountOptions;
  }
  return [];
}

export function financialActivitySelectOptions(activities: FineractFinancialActivityRef[]) {
  return activities.map((activity) => ({
    value: String(activity.id),
    label: formatFinancialActivityLabel(activity),
    keywords: [activity.name, String(activity.id)]
  }));
}

export function financialActivityGlAccountSelectOptions(
  accounts: FineractFinancialActivityGlAccountRef[]
) {
  return accounts.map((account) => ({
    value: String(account.id),
    label: formatFinancialActivityGlAccountLabel(account),
    keywords: [account.glCode, account.name]
  }));
}

export function defaultFinancialActivityMappingFormValues(): UpsertFinancialActivityMappingFormInput {
  return {
    financialActivityId: 0,
    glAccountId: 0
  };
}

export function financialActivityMappingFormValuesFromDetail(
  mapping: FineractFinancialActivityMappingListItem
): UpsertFinancialActivityMappingFormInput {
  return {
    financialActivityId: mapping.financialActivityData.id,
    glAccountId: mapping.glAccountData.id
  };
}

export function financialActivityMappingFormValuesFromEditData(
  data: FineractFinancialActivityMappingEditData
): UpsertFinancialActivityMappingFormInput {
  return financialActivityMappingFormValuesFromDetail(data);
}

export function financialActivityMappingFormTemplateFromEditData(
  data: FineractFinancialActivityMappingEditData
): FineractFinancialActivityMappingFormTemplate {
  return {
    financialActivityOptions: data.financialActivityOptions,
    glAccountOptions: data.glAccountOptions
  };
}

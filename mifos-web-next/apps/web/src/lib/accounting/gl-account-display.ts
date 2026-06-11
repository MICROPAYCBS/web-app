/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractGlAccountDetail,
  FineractGlAccountFormTemplate,
  FineractGlAccountRef
} from '@mifos/api-client';
import type { UpsertGlAccountFormInput } from '@mifos/validation';

export const GL_ACCOUNT_TYPE_ASSET = 1;
export const GL_ACCOUNT_TYPE_LIABILITY = 2;
export const GL_ACCOUNT_TYPE_EQUITY = 3;
export const GL_ACCOUNT_TYPE_INCOME = 4;
export const GL_ACCOUNT_TYPE_EXPENSE = 5;

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense'
};

export function formatGlAccountTypeLabel(option: FineractEnumOption | undefined) {
  if (!option?.value) {
    return '—';
  }
  return TYPE_LABELS[option.value] ?? option.value;
}

export function formatGlAccountLabel(account: Pick<FineractGlAccountRef, 'glCode' | 'name'>) {
  return `(${account.glCode}) ${account.name}`;
}

export function headerOptionsForType(
  template: FineractGlAccountFormTemplate,
  typeId: number | undefined
): FineractGlAccountRef[] {
  switch (typeId) {
    case GL_ACCOUNT_TYPE_ASSET:
      return template.assetHeaderAccountOptions ?? [];
    case GL_ACCOUNT_TYPE_LIABILITY:
      return template.liabilityHeaderAccountOptions ?? [];
    case GL_ACCOUNT_TYPE_EQUITY:
      return template.equityHeaderAccountOptions ?? [];
    case GL_ACCOUNT_TYPE_INCOME:
      return template.incomeHeaderAccountOptions ?? [];
    case GL_ACCOUNT_TYPE_EXPENSE:
      return template.expenseHeaderAccountOptions ?? [];
    default:
      return [];
  }
}

export function tagOptionsForType(
  template: FineractGlAccountFormTemplate,
  typeId: number | undefined
): FineractEnumOption[] {
  switch (typeId) {
    case GL_ACCOUNT_TYPE_ASSET:
      return template.allowedAssetsTagOptions ?? [];
    case GL_ACCOUNT_TYPE_LIABILITY:
      return template.allowedLiabilitiesTagOptions ?? [];
    case GL_ACCOUNT_TYPE_EQUITY:
      return template.allowedEquityTagOptions ?? [];
    case GL_ACCOUNT_TYPE_INCOME:
      return template.allowedIncomeTagOptions ?? [];
    case GL_ACCOUNT_TYPE_EXPENSE:
      return template.allowedExpensesTagOptions ?? [];
    default:
      return [];
  }
}

export function defaultGlAccountFormValues(
  template: FineractGlAccountFormTemplate,
  options?: { parentId?: number; accountType?: number }
): UpsertGlAccountFormInput {
  const type =
    options?.accountType ??
    template.accountTypeOptions[0]?.id ??
    GL_ACCOUNT_TYPE_ASSET;
  const usage = template.usageOptions[0]?.id ?? 1;

  return {
    type,
    name: '',
    usage,
    glCode: '',
    parentId: options?.parentId,
    tagId: undefined,
    manualEntriesAllowed: true,
    description: ''
  };
}

export function glAccountToFormValues(account: FineractGlAccountDetail): UpsertGlAccountFormInput {
  return {
    type: account.type.id,
    name: account.name,
    usage: account.usage.id,
    glCode: account.glCode,
    parentId: account.parentId,
    tagId: account.tagId?.id,
    manualEntriesAllowed: account.manualEntriesAllowed,
    description: account.description ?? ''
  };
}

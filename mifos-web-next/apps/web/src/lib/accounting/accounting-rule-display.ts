/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountingRuleDetail,
  FineractAccountingRuleFormTemplate,
  FineractAccountingRuleListItem,
  FineractAccountingRuleTemplateOption
} from '@mifos/api-client';
import type { UpsertAccountingRuleFormInput } from '@mifos/validation';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';

export function formatAccountingRuleAccountLabel(account: FineractAccountingRuleTemplateOption) {
  if (account.glCode) {
    return formatGlAccountLabel({ name: account.name, glCode: account.glCode });
  }
  return account.name;
}

export function formatAccountingRuleDebitTags(rule: FineractAccountingRuleListItem) {
  if (!rule.debitTags?.length) {
    return '—';
  }
  return rule.debitTags.map((entry) => entry.tag.name).join(', ');
}

export function formatAccountingRuleCreditTags(rule: FineractAccountingRuleListItem) {
  if (!rule.creditTags?.length) {
    return '—';
  }
  return rule.creditTags.map((entry) => entry.tag.name).join(', ');
}

export function formatAccountingRuleDebitAccount(rule: FineractAccountingRuleListItem) {
  const account = rule.debitAccounts?.[0];
  if (!account) {
    return '—';
  }
  return account.glCode ? `${account.name} (${account.glCode})` : account.name;
}

export function formatAccountingRuleCreditAccount(rule: FineractAccountingRuleListItem) {
  const account = rule.creditAccounts?.[0];
  if (!account) {
    return '—';
  }
  return account.glCode ? `${account.name} (${account.glCode})` : account.name;
}

export function yesNoLabel(value: boolean | undefined) {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
}

export function defaultAccountingRuleFormValues(
  template: FineractAccountingRuleFormTemplate
): UpsertAccountingRuleFormInput {
  return {
    name: '',
    officeId: template.allowedOffices[0]?.id ?? 0,
    debitRuleType: 'fixedAccount',
    creditRuleType: 'fixedAccount',
    debitTags: [],
    creditTags: [],
    allowMultipleDebitEntries: false,
    allowMultipleCreditEntries: false,
    description: ''
  };
}

export function accountingRuleToFormValues(
  rule: FineractAccountingRuleDetail
): UpsertAccountingRuleFormInput {
  return {
    name: rule.name,
    officeId: rule.officeId,
    description: rule.description ?? '',
    debitRuleType: rule.debitAccounts?.length ? 'fixedAccount' : 'listOfAccounts',
    accountToDebit: rule.debitAccounts?.[0]?.id,
    debitTags: rule.debitTags?.map((entry) => entry.tag.id) ?? [],
    allowMultipleDebitEntries: rule.allowMultipleDebitEntries ?? false,
    creditRuleType: rule.creditAccounts?.length ? 'fixedAccount' : 'listOfAccounts',
    accountToCredit: rule.creditAccounts?.[0]?.id,
    creditTags: rule.creditTags?.map((entry) => entry.tag.id) ?? [],
    allowMultipleCreditEntries: rule.allowMultipleCreditEntries ?? false
  };
}

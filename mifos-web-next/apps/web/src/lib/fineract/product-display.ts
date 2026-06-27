/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption, ProductGlAccountRef } from '@mifos/api-client';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

/** Display label for a GL account reference from product detail. */
export function glAccountLabel(account?: ProductGlAccountRef): string {
  if (!account) {
    return '—';
  }
  const code = account.glCode?.trim();
  const name = account.name?.trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return code ?? name ?? '—';
}

export function accountingRuleLabel(rule?: FineractEnumOption): string {
  const label = enumOptionLabel(rule);
  if (label) {
    return label;
  }
  if (rule?.code) {
    return rule.code.replace(/_/g, ' ');
  }
  return '—';
}

/** Fineract convention: accounting rule id 1 / code NONE = no ledger posting. */
export function isNoneAccountingRule(rule?: FineractEnumOption | number | null): boolean {
  if (typeof rule === 'number') {
    return rule === 1;
  }
  if (!rule) {
    return false;
  }
  if (rule.id === 1) {
    return true;
  }
  const code = rule.code?.toUpperCase() ?? '';
  return code === 'NONE' || code === 'ACCOUNTINGTYPE.NONE';
}

/** Options shown in product create/edit wizards (excludes None). */
export function selectableAccountingRuleOptions(
  options: FineractEnumOption[] | undefined
): FineractEnumOption[] {
  return (options ?? []).filter((option) => !isNoneAccountingRule(option));
}

export function defaultSelectableAccountingRuleId(
  options: FineractEnumOption[] | undefined
): number {
  return selectableAccountingRuleOptions(options)[0]?.id ?? 2;
}

export function resolveSelectableAccountingRuleId(
  ruleId: number | undefined,
  options: FineractEnumOption[] | undefined
): number {
  const selectable = selectableAccountingRuleOptions(options);
  if (
    ruleId != null &&
    !isNoneAccountingRule(ruleId) &&
    selectable.some((option) => option.id === ruleId)
  ) {
    return ruleId;
  }
  return defaultSelectableAccountingRuleId(options);
}

/** Initial accounting rule for product wizard drafts. */
export function productDraftAccountingRuleId(
  templateRule: FineractEnumOption | undefined,
  options: FineractEnumOption[] | undefined
): number {
  const selectable = selectableAccountingRuleOptions(options);
  const fromTemplate = templateRule?.id;
  if (
    fromTemplate != null &&
    !isNoneAccountingRule(fromTemplate) &&
    selectable.some((option) => option.id === fromTemplate)
  ) {
    return fromTemplate;
  }
  return defaultSelectableAccountingRuleId(options);
}

/** Accounting rule id 1 = None (Fineract convention). */
export function isProductAccountingEnabled(rule?: FineractEnumOption): boolean {
  if (!rule) {
    return false;
  }
  if (rule.id === 1) {
    return false;
  }
  const code = rule.code?.toLowerCase() ?? '';
  return code !== 'none' && code !== 'accountingtype.none';
}

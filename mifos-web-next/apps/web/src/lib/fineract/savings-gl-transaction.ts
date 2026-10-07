/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract savingsAccountStatusType.active */
export const SAVINGS_ACCOUNT_ACTIVE_STATUS_ID = 300;

/** accountingRuleType.cash, accrual.periodic, accrual.upfront. None is 1. */
const GL_SAVINGS_ACCOUNTING_RULE_IDS = new Set([2, 3, 4]);

export function savingsAccountStatusIsActive(status: { id?: number } | undefined): boolean {
  return status?.id === SAVINGS_ACCOUNT_ACTIVE_STATUS_ID;
}

export function savingsAccountingRuleAllowsGlTransactions(
  accountingRule: { id?: number } | null | undefined
): boolean {
  return accountingRule?.id != null && GL_SAVINGS_ACCOUNTING_RULE_IDS.has(accountingRule.id);
}

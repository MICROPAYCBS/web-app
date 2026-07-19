/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, FineractAuditTrailListItem } from '@mifos/api-client';
import {
  filterAuditTrailsForResource,
  filterCheckerInboxItemsForResource,
  mergePendingCheckerActions,
  pendingCheckerActionsFromAudits
} from '@/lib/fineract/resource-pending-checker-filters';
import {
  LOAN_ACCOUNT_CHECKER_ENTITY,
  loanAccountPendingCheckerScope,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';

export { LOAN_ACCOUNT_CHECKER_ENTITY };

export function filterAuditTrailsForLoanAccount(
  audits: FineractAuditTrailListItem[],
  accountId: string | number
): FineractAuditTrailListItem[] {
  return filterAuditTrailsForResource(audits, loanAccountPendingCheckerScope(Number(accountId)));
}

export function filterCheckerInboxItemsForLoanAccount(
  items: CheckerInboxListItem[],
  loanAccountId: number
): CheckerInboxListItem[] {
  return filterCheckerInboxItemsForResource(items, loanAccountPendingCheckerScope(loanAccountId));
}

export function loanPendingCheckerActionsFromAudits(
  audits: FineractAuditTrailListItem[],
  loanAccountId: number
): ResourcePendingCheckerAction[] {
  return pendingCheckerActionsFromAudits(audits, loanAccountPendingCheckerScope(loanAccountId));
}

export const mergeLoanPendingCheckerActions = mergePendingCheckerActions;

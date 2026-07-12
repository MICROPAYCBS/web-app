/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, FineractAuditTrailListItem } from '@mifos/api-client';
import { isPendingCheckerAuditResult } from '@/lib/fineract/audit-trail-display';
import type { LoanAccountPendingCheckerAction } from '@/lib/fineract/loan-account-pending-checker-display';

/** Fineract entity for loan account maker-checker commands. */
export const LOAN_ACCOUNT_CHECKER_ENTITY = 'LOAN';

export function filterAuditTrailsForLoanAccount(
  audits: FineractAuditTrailListItem[],
  accountId: string | number
): FineractAuditTrailListItem[] {
  const loanId = Number(accountId);
  if (!Number.isFinite(loanId)) {
    return [];
  }
  return audits.filter(
    (audit) =>
      audit.resourceId === loanId &&
      audit.entityName?.trim().toUpperCase() === LOAN_ACCOUNT_CHECKER_ENTITY
  );
}

export function filterCheckerInboxItemsForLoanAccount(
  items: CheckerInboxListItem[],
  loanAccountId: number
): CheckerInboxListItem[] {
  return items.filter(
    (item) =>
      item.resourceId === loanAccountId &&
      item.entityName?.trim().toUpperCase() === LOAN_ACCOUNT_CHECKER_ENTITY
  );
}

function pendingFromAuditEntry(audit: FineractAuditTrailListItem): LoanAccountPendingCheckerAction {
  return {
    id: audit.id,
    actionName: audit.actionName,
    entityName: audit.entityName,
    maker: audit.maker,
    madeOnDate: audit.madeOnDate
  };
}

export function loanPendingCheckerActionsFromAudits(
  audits: FineractAuditTrailListItem[],
  loanAccountId: number
): LoanAccountPendingCheckerAction[] {
  return audits
    .filter(
      (audit) =>
        audit.resourceId === loanAccountId &&
        audit.entityName?.trim().toUpperCase() === LOAN_ACCOUNT_CHECKER_ENTITY &&
        isPendingCheckerAuditResult(audit.processingResult)
    )
    .map(pendingFromAuditEntry);
}

export function mergeLoanPendingCheckerActions(
  inbox: LoanAccountPendingCheckerAction[],
  audits: LoanAccountPendingCheckerAction[]
): LoanAccountPendingCheckerAction[] {
  const byId = new Map<number, LoanAccountPendingCheckerAction>();
  for (const item of [...inbox, ...audits]) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

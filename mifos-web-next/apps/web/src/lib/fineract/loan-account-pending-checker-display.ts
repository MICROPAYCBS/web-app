/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDateTimeValue } from '@/lib/fineract/dates';
import { formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';

export type LoanAccountPendingCheckerAction = {
  id: number;
  actionName?: string;
  entityName?: string;
  maker?: string;
  madeOnDate?: FineractDateTimeValue;
};

export function hasLoanPendingCheckerAction(
  actions: LoanAccountPendingCheckerAction[],
  actionName: string
): boolean {
  const needle = actionName.trim().toUpperCase();
  return actions.some((item) => item.actionName?.trim().toUpperCase() === needle);
}

function normalizeLoanCheckerActionName(actionName?: string): string {
  return actionName?.trim().toUpperCase().replace(/\s+/g, '') ?? '';
}

/** Lifecycle order for choosing which queued command drives the loan banner and workflow. */
export function preferredLoanPendingCheckerActionsForStatus(status?: {
  code?: string;
  value?: string;
}): string[] {
  const code = status?.code ?? '';
  const value = status?.value ?? '';

  if (
    code.includes('submitted.and.pending') ||
    value === 'Submitted and pending approval'
  ) {
    return ['APPROVE', 'CREATE', 'REJECT', 'WITHDRAWNBYAPPLICANT', 'UPDATE'];
  }
  if (code.includes('approved') || value === 'Approved') {
    return ['DISBURSE', 'DISBURSETOSAVINGS', 'UNDOAPPROVAL', 'REJECT', 'WITHDRAWNBYAPPLICANT'];
  }

  return [
    'APPROVE',
    'DISBURSE',
    'DISBURSETOSAVINGS',
    'CREATE',
    'UPDATE',
    'REJECT',
    'WITHDRAWNBYAPPLICANT'
  ];
}

/** Pick the queued command that best matches the loan lifecycle and workflow UI. */
export function resolvePrimaryLoanPendingCheckerAction(
  actions: LoanAccountPendingCheckerAction[],
  status?: { code?: string; value?: string }
): LoanAccountPendingCheckerAction | undefined {
  if (actions.length === 0) {
    return undefined;
  }
  if (actions.length === 1) {
    return actions[0];
  }

  const preferred = preferredLoanPendingCheckerActionsForStatus(status);
  for (const actionName of preferred) {
    const match = actions.find(
      (item) => normalizeLoanCheckerActionName(item.actionName) === actionName
    );
    if (match) {
      return match;
    }
  }

  return actions[0];
}

/** User-facing label for a queued loan command. */
export function describeLoanPendingCheckerAction(action: LoanAccountPendingCheckerAction): string {
  const actionLabel = action.actionName
    ? formatAuditTrailFilterLabel(action.actionName)
    : 'Change';
  return `${actionLabel} awaiting checker review`;
}

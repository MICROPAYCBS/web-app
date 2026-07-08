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

/** User-facing label for a queued loan command. */
export function describeLoanPendingCheckerAction(action: LoanAccountPendingCheckerAction): string {
  const actionLabel = action.actionName
    ? formatAuditTrailFilterLabel(action.actionName)
    : 'Change';
  return `${actionLabel} awaiting checker review`;
}

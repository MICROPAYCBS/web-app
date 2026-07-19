/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDateTimeValue } from '@/lib/fineract/dates';
import {
  describePendingCheckerAction,
  hasPendingCheckerAction,
  LOAN_ACCOUNT_CHECKER_ENTITY,
  preferredPendingCheckerActionsForStatus,
  resolvePrimaryPendingCheckerAction,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';

export type LoanAccountPendingCheckerAction = ResourcePendingCheckerAction;

export const hasLoanPendingCheckerAction = hasPendingCheckerAction;

export function preferredLoanPendingCheckerActionsForStatus(status?: {
  code?: string;
  value?: string;
}): string[] {
  return preferredPendingCheckerActionsForStatus(LOAN_ACCOUNT_CHECKER_ENTITY, status);
}

export function resolvePrimaryLoanPendingCheckerAction(
  actions: LoanAccountPendingCheckerAction[],
  status?: { code?: string; value?: string }
): LoanAccountPendingCheckerAction | undefined {
  return resolvePrimaryPendingCheckerAction(actions, LOAN_ACCOUNT_CHECKER_ENTITY, status);
}

export function describeLoanPendingCheckerAction(action: {
  actionName?: string;
  madeOnDate?: FineractDateTimeValue;
}): string {
  return describePendingCheckerAction(action);
}

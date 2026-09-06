/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type DepositAccountLifecycleCommand =
  | 'approve'
  | 'activate'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoApproval'
  | 'undoActivation'
  | 'calculateInterest'
  | 'postInterest'
  | 'prematureClose'
  | 'close';

/** Fineract API command for undo activation. */
export const DEPOSIT_UNDO_ACTIVATION_API_COMMAND = 'undoactivate';

export type DepositAccountTransactionCommand = 'deposit' | 'withdrawal';

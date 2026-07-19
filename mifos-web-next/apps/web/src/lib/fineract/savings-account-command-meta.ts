/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Client-safe command names and code lookups (no server-only imports). */

/** Fineract code name for savings account block reasons (all transactions). */
export const SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAME = 'SavingsAccountBlockReasons';

/** Fineract code names for savings account block reasons by command. */
export const SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES = {
  block: SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAME,
  blockCredit: 'CreditTransactionFreezeReasons',
  blockDebit: 'DebitTransactionFreezeReasons'
} as const;

export type SavingsAccountBlockReasonKind = keyof typeof SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES;

/** @deprecated Use {@link SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES} with listCodeValuesByName. */
export const SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID = 35;

/** Fineract code name for hold-amount freeze reasons. */
export const SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME = 'SavingsTransactionFreezeReasons';

export type SavingsAccountLifecycleCommand =
  | 'approve'
  | 'activate'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoApproval'
  | 'close'
  | 'block'
  | 'unblock'
  | 'blockCredit'
  | 'unblockCredit'
  | 'blockDebit'
  | 'unblockDebit'
  | 'calculateInterest'
  | 'postInterest'
  | 'assignSavingsOfficer'
  | 'unassignSavingsOfficer';

export type SavingsAccountTransactionCommand =
  | 'deposit'
  | 'withdrawal'
  | 'postInterestAsOn'
  | 'holdAmount';

export type SavingsAccountExistingTransactionCommand = 'undo' | 'modify' | 'releaseAmount';

export type SavingsAccountChargeCommand = 'paycharge';

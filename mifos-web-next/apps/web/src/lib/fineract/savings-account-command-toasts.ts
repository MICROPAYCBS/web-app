/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CommandOutcomeToastMessages } from '@/lib/command-outcome-toast';

export const SAVINGS_ACCOUNT_CREATE_TOAST: CommandOutcomeToastMessages = {
  completed: 'Application submitted.',
  pending: 'Application sent for approval.'
};

export const SAVINGS_LIFECYCLE_COMMAND_TOAST = {
  approve: {
    completed: 'Savings account approved.',
    pending: 'Approval sent for checker review.'
  },
  activate: {
    completed: 'Savings account activated.',
    pending: 'Activation sent for checker review.'
  },
  reject: {
    completed: 'Savings account rejected.',
    pending: 'Rejection sent for checker review.'
  },
  withdrawnByApplicant: {
    completed: 'Application withdrawn.',
    pending: 'Withdrawal sent for checker review.'
  },
  undoApproval: {
    completed: 'Approval undone.',
    pending: 'Undo approval sent for checker review.'
  },
  unblock: {
    completed: 'Account unblocked.',
    pending: 'Unblock sent for checker review.'
  },
  unblockCredit: {
    completed: 'Deposits unblocked.',
    pending: 'Unblock sent for checker review.'
  },
  unblockDebit: {
    completed: 'Withdrawals unblocked.',
    pending: 'Unblock sent for checker review.'
  }
} satisfies Record<string, CommandOutcomeToastMessages>;

export const SAVINGS_CONFIRM_COMMAND_TOAST = {
  calculateInterest: {
    completed: 'Interest calculated.',
    pending: 'Interest calculation sent for checker review.'
  },
  postInterest: {
    completed: 'Interest posted.',
    pending: 'Interest posting sent for checker review.'
  },
  deleteAccount: {
    completed: 'Savings account deleted.',
    pending: 'Deletion sent for checker review.'
  },
  enableWithholdTax: {
    completed: 'Withhold tax enabled.',
    pending: 'Withhold tax change sent for checker review.'
  },
  disableWithholdTax: {
    completed: 'Withhold tax disabled.',
    pending: 'Withhold tax change sent for checker review.'
  }
} satisfies Record<string, CommandOutcomeToastMessages>;

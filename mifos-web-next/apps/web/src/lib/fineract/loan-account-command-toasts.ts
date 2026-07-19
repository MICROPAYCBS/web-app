/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CommandOutcomeToastMessages } from '@/lib/command-outcome-toast';

export const LOAN_APPROVE_COMMAND_TOAST: CommandOutcomeToastMessages = {
  completed: 'Loan approved.',
  pending: 'Submitted for approval.'
};

export const LOAN_DISBURSE_COMMAND_TOAST: CommandOutcomeToastMessages = {
  completed: 'Loan disbursed.',
  pending: 'Submitted for approval.'
};

export const LOAN_DISBURSE_TO_SAVINGS_COMMAND_TOAST: CommandOutcomeToastMessages = {
  completed: 'Loan disbursed to savings.',
  pending: 'Submitted for approval.'
};

export const LOAN_LIFECYCLE_COMMAND_TOAST: Record<
  'reject' | 'withdraw' | 'undoApproval' | 'undoDisbursal',
  CommandOutcomeToastMessages
> = {
  reject: {
    completed: 'Loan rejected.',
    pending: 'Loan rejection sent for checker review.'
  },
  withdraw: {
    completed: 'Loan application withdrawn.',
    pending: 'Withdrawal sent for checker review.'
  },
  undoApproval: {
    completed: 'Loan approval undone.',
    pending: 'Undo approval sent for checker review.'
  },
  undoDisbursal: {
    completed: 'Loan disbursal undone.',
    pending: 'Undo disbursal sent for checker review.'
  }
};

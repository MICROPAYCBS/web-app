/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CommandOutcomeToastMessages } from '@/lib/command-outcome-toast';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import { depositAccountKindLabel } from '@/lib/fineract/deposit-account-display';

function kindLabel(kind: TermDepositAccountKind): string {
  return depositAccountKindLabel(kind);
}

export function depositLifecycleCommandToast(
  kind: TermDepositAccountKind,
  command: string
): CommandOutcomeToastMessages {
  const label = kindLabel(kind);
  const map: Record<string, CommandOutcomeToastMessages> = {
    approve: {
      completed: `${capitalize(label)} approved.`,
      pending: 'Approval sent for checker review.'
    },
    activate: {
      completed: `${capitalize(label)} activated.`,
      pending: 'Activation sent for checker review.'
    },
    reject: {
      completed: `${capitalize(label)} rejected.`,
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
    undoActivation: {
      completed: 'Activation undone.',
      pending: 'Undo activation sent for checker review.'
    },
    prematureClose: {
      completed: `${capitalize(label)} closed early.`,
      pending: 'Premature close sent for checker review.'
    },
    close: {
      completed: `${capitalize(label)} closed.`,
      pending: 'Close sent for checker review.'
    },
    calculateInterest: {
      completed: 'Interest calculated.',
      pending: 'Interest calculation sent for checker review.'
    },
    postInterest: {
      completed: 'Interest posted.',
      pending: 'Interest posting sent for checker review.'
    },
    deleteAccount: {
      completed: `${capitalize(label)} deleted.`,
      pending: 'Deletion sent for checker review.'
    },
    deposit: {
      completed: 'Deposit posted.',
      pending: 'Deposit sent for checker review.'
    },
    withdrawal: {
      completed: 'Withdrawal posted.',
      pending: 'Withdrawal sent for checker review.'
    }
  };
  return (
    map[command] ?? {
      completed: 'Action completed.',
      pending: 'Action sent for checker review.'
    }
  );
}

function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

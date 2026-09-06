/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, FineractSavingsAccountDetail } from '@mifos/api-client';

export type TermDepositAccountKind = Extract<
  ClientDepositAccountKind,
  'fixedDeposit' | 'recurringDeposit'
>;

const DEPOSIT_STATUS = {
  pending: 'savingsAccountStatusType.submitted.and.pending.approval',
  approved: 'savingsAccountStatusType.approved',
  active: 'savingsAccountStatusType.active',
  matured: 'savingsAccountStatusType.matured'
} as const;

export type DepositAccountActionVisibility = {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  undoApproval: boolean;
  undoActivation: boolean;
  prematureClose: boolean;
  close: boolean;
  calculateInterest: boolean;
  postInterest: boolean;
  deposit: boolean;
  withdrawal: boolean;
  deleteAccount: boolean;
  addCharge: boolean;
  modifyApplication: boolean;
};

export type DepositAccountSectionId = 'summary' | 'transactions' | 'charges';

export const DEPOSIT_ACCOUNT_DEFAULT_SECTION: DepositAccountSectionId = 'summary';

export const DEPOSIT_ACCOUNT_SECTIONS: Array<{ id: DepositAccountSectionId; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'charges', label: 'Charges' }
];

export function isTermDepositAccountKind(
  kind: ClientDepositAccountKind
): kind is TermDepositAccountKind {
  return kind === 'fixedDeposit' || kind === 'recurringDeposit';
}

export function depositAccountEntityPermissionSuffix(kind: TermDepositAccountKind): string {
  return kind === 'fixedDeposit' ? 'FIXEDDEPOSITACCOUNT' : 'RECURRINGDEPOSITACCOUNT';
}

export function depositAccountPermission(
  kind: TermDepositAccountKind,
  action: string
): string {
  return `${action}_${depositAccountEntityPermissionSuffix(kind)}`;
}

export function depositAccountActionVisibility(
  account: FineractSavingsAccountDetail,
  kind: TermDepositAccountKind
): DepositAccountActionVisibility {
  const code = account.status.code ?? '';
  const pending = code === DEPOSIT_STATUS.pending;
  const approved = code === DEPOSIT_STATUS.approved;
  const active = code === DEPOSIT_STATUS.active || account.status.active === true;
  const matured = code === DEPOSIT_STATUS.matured;
  const isRecurring = kind === 'recurringDeposit';

  return {
    approve: pending,
    activate: approved,
    reject: pending,
    withdrawnByApplicant: pending,
    undoApproval: approved,
    undoActivation: active,
    prematureClose: active,
    close: matured,
    calculateInterest: active || matured,
    postInterest: active || matured,
    deposit: isRecurring && active,
    withdrawal: isRecurring && active,
    deleteAccount: pending,
    addCharge: pending || active || matured,
    modifyApplication: pending
  };
}

export function depositAccountKindLabel(kind: TermDepositAccountKind): string {
  return kind === 'fixedDeposit' ? 'fixed deposit' : 'recurring deposit';
}

export function depositAccountKindTitle(kind: TermDepositAccountKind): string {
  return kind === 'fixedDeposit' ? 'Fixed deposit account' : 'Recurring deposit account';
}

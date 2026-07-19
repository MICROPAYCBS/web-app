/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind } from '@mifos/api-client';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';

export type DepositFieldOfficerKind = Exclude<ClientDepositAccountKind, never>;

export type DepositFieldOfficerConfig = {
  kind: DepositFieldOfficerKind;
  apiPath: string;
  assignPermission: string;
  removePermission: string;
  officerLabel: string;
};

export const DEPOSIT_FIELD_OFFICER_CONFIG: Record<DepositFieldOfficerKind, DepositFieldOfficerConfig> =
  {
    savings: {
      kind: 'savings',
      apiPath: CLIENT_DEPOSIT_ACCOUNT_CONFIG.savings.apiPath,
      assignPermission: 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT',
      removePermission: 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT',
      officerLabel: 'Field officer'
    },
    fixedDeposit: {
      kind: 'fixedDeposit',
      apiPath: CLIENT_DEPOSIT_ACCOUNT_CONFIG.fixedDeposit.apiPath,
      assignPermission: 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT',
      removePermission: 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT',
      officerLabel: 'Field officer'
    },
    recurringDeposit: {
      kind: 'recurringDeposit',
      apiPath: CLIENT_DEPOSIT_ACCOUNT_CONFIG.recurringDeposit.apiPath,
      assignPermission: 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT',
      removePermission: 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT',
      officerLabel: 'Field officer'
    }
  };

export const LOAN_OFFICER_CONFIG = {
  apiPath: 'loans',
  assignPermission: 'UPDATELOANOFFICER_LOAN',
  removePermission: 'REMOVELOANOFFICER_LOAN',
  officerLabel: 'Loan officer'
} as const;

export const DEPOSIT_ACCOUNT_STATUS = {
  pending: 'savingsAccountStatusType.submitted.and.pending.approval',
  approved: 'savingsAccountStatusType.approved',
  active: 'savingsAccountStatusType.active'
} as const;

export const LOAN_ACCOUNT_STATUS = {
  pending: 'loanStatusType.submitted.and.pending.approval',
  approved: 'loanStatusType.approved',
  active: 'loanStatusType.active'
} as const;

export function depositAccountFieldOfficerVisibility(account: {
  fieldOfficerId?: number;
  fieldOfficerName?: string;
  status: { code?: string; active?: boolean };
}): { assignStaff: boolean; reassignStaff: boolean } {
  const code = account.status.code ?? '';
  const pending = code === DEPOSIT_ACCOUNT_STATUS.pending;
  const approved = code === DEPOSIT_ACCOUNT_STATUS.approved;
  const active = code === DEPOSIT_ACCOUNT_STATUS.active || account.status.active === true;
  const hasOfficer = Boolean(account.fieldOfficerId || account.fieldOfficerName?.trim());
  const canManage = pending || approved || active;
  return {
    assignStaff: canManage && !hasOfficer,
    reassignStaff: canManage && hasOfficer
  };
}

export function loanAccountOfficerVisibility(account: {
  loanOfficerId?: number;
  loanOfficerName?: string;
  status: { code?: string; active?: boolean; value?: string };
}): { assignOfficer: boolean; reassignOfficer: boolean } {
  const code = account.status.code ?? '';
  const value = account.status.value ?? '';
  const pending =
    code === LOAN_ACCOUNT_STATUS.pending || value === 'Submitted and pending approval';
  const approved = code === LOAN_ACCOUNT_STATUS.approved || value === 'Approved';
  const active =
    code === LOAN_ACCOUNT_STATUS.active || value === 'Active' || account.status.active === true;
  const hasOfficer = Boolean(account.loanOfficerId || account.loanOfficerName?.trim());
  const canManage = pending || approved || active;
  return {
    assignOfficer: canManage && !hasOfficer,
    reassignOfficer: canManage && hasOfficer
  };
}

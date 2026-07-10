/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Client-safe loan account command metadata (no server-only imports). */

export type LoanAccountLifecycleCommand =
  | 'approve'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoapproval'
  | 'undodisbursal'
  | 'disburse'
  | 'disbursetosavings';

export type LoanAccountTransactionCommand =
  | 'repayment'
  | 'writeoff'
  | 'recoverypayment'
  | 'foreclosure'
  | 'waiveinterest'
  | 'close'
  | 'close-rescheduled';

export const LOAN_LIFECYCLE_COMMAND_PERMISSIONS: Record<LoanAccountLifecycleCommand, string> = {
  approve: 'APPROVE_LOAN',
  reject: 'REJECT_LOAN',
  withdrawnByApplicant: 'WITHDRAW_LOAN',
  undoapproval: 'APPROVALUNDO_LOAN',
  undodisbursal: 'DISBURSALUNDO_LOAN',
  disburse: 'DISBURSE_LOAN',
  disbursetosavings: 'DISBURSETOSAVINGS_LOAN'
};

export const LOAN_TRANSACTION_COMMAND_PERMISSIONS: Record<LoanAccountTransactionCommand, string> = {
  repayment: 'REPAYMENT_LOAN',
  writeoff: 'WRITEOFF_LOAN',
  recoverypayment: 'RECOVERYPAYMENT_LOAN',
  foreclosure: 'FORECLOSURE_LOAN',
  waiveinterest: 'WAIVEINTERESTPORTION_LOAN',
  close: 'CLOSE_LOAN',
  'close-rescheduled': 'CLOSEASRESCHEDULED_LOAN'
};

export const LOAN_DELETE_PERMISSION = 'DELETE_LOAN';
export const LOAN_ADD_CHARGE_PERMISSION = 'CREATE_LOANCHARGE';

export interface LoanAccountActionVisibility {
  approve: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  deleteAccount: boolean;
  undoApproval: boolean;
  disburse: boolean;
  disburseToSavings: boolean;
  undoDisbursal: boolean;
  makeRepayment: boolean;
  addCharge: boolean;
  foreclosure: boolean;
  waiveInterest: boolean;
  writeOff: boolean;
  close: boolean;
  closeAsRescheduled: boolean;
  recoveryPayment: boolean;
  undoWriteOff: boolean;
  assignOfficer: boolean;
  reassignOfficer: boolean;
  modifyApplication: boolean;
}

const LOAN_STATUS = {
  pending: 'Submitted and pending approval',
  approved: 'Approved',
  active: 'Active',
  overpaid: 'Overpaid',
  closedWrittenOff: 'Closed (written off)',
  closedObligationsMet: 'Closed (obligations met)'
} as const;

function statusValue(status: { code?: string; value?: string; active?: boolean }): string {
  return status.value ?? '';
}

export function loanAccountActionVisibility(account: {
  loanOfficerId?: number;
  loanOfficerName?: string;
  status: { code?: string; value?: string; active?: boolean };
}): LoanAccountActionVisibility {
  const value = statusValue(account.status);
  const pending = value === LOAN_STATUS.pending;
  const approved = value === LOAN_STATUS.approved;
  const active = value === LOAN_STATUS.active || account.status.active === true;
  const overpaid = value === LOAN_STATUS.overpaid;
  const closedWrittenOff = value === LOAN_STATUS.closedWrittenOff;
  const closedObligationsMet = value === LOAN_STATUS.closedObligationsMet;
  const hasOfficer = Boolean(account.loanOfficerId || account.loanOfficerName?.trim());
  const canManageOfficer = pending || approved || active;

  return {
    approve: pending,
    reject: pending,
    withdrawnByApplicant: pending,
    deleteAccount: pending,
    undoApproval: approved,
    disburse: approved,
    disburseToSavings: approved,
    undoDisbursal: active,
    makeRepayment: active || overpaid,
    addCharge: pending || approved || active || overpaid,
    foreclosure: active,
    waiveInterest: active,
    writeOff: active,
    close: active,
    closeAsRescheduled: active,
    recoveryPayment: closedWrittenOff,
    undoWriteOff: closedWrittenOff,
    assignOfficer: canManageOfficer && !hasOfficer,
    reassignOfficer: canManageOfficer && hasOfficer,
    modifyApplication: pending
  };
}

export function loanAccountLifecycleDialogKindForCommand(
  command: Extract<
    LoanAccountLifecycleCommand,
    'reject' | 'withdrawnByApplicant' | 'undoapproval' | 'undodisbursal'
  >
): 'reject' | 'withdraw' | 'undoApproval' | 'undoDisbursal' {
  switch (command) {
    case 'reject':
      return 'reject';
    case 'withdrawnByApplicant':
      return 'withdraw';
    case 'undoapproval':
      return 'undoApproval';
    case 'undodisbursal':
      return 'undoDisbursal';
    default:
      return 'reject';
  }
}

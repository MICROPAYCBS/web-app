'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  savingsAccountActivateCommandSchema,
  savingsAccountAddChargeSchema,
  savingsAccountApproveCommandSchema,
  savingsAccountAssignStaffSchema,
  savingsAccountBlockCommandSchema,
  savingsAccountCloseCommandSchema,
  savingsAccountHoldAmountSchema,
  savingsAccountPayChargeSchema,
  savingsAccountPostInterestAsOnSchema,
  savingsAccountRejectCommandSchema,
  savingsAccountTransactionCommandSchema,
  savingsAccountUndoApprovalCommandSchema,
  savingsAccountUnassignStaffSchema,
  savingsAccountWithdrawnByApplicantCommandSchema,
  savingsAccountWithholdTaxSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import type { SavingsAccountActionResult } from '@/lib/fineract/savings-account-action-result';
import {
  createSavingsAccountCharge,
  deleteSavingsAccount,
  executeSavingsAccountChargeCommand,
  executeSavingsAccountCommand,
  executeSavingsAccountTransaction,
  getSavingsAccountChargeDetailTemplate,
  getSavingsAccountChargeTemplate,
  getSavingsAccountTransactionTemplate,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES,
  SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME,
  type SavingsAccountBlockReasonKind,
  updateSavingsAccountWithholdTax,
  type SavingsAccountLifecycleCommand,
  type SavingsAccountTransactionCommand
} from '@/lib/fineract/savings-account-commands';
import { getClientWithTemplate } from '@/lib/fineract/client-action-data';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';
import { savingsAccountAnnualFeeCharge } from '@/lib/fineract/savings-account-display';
import { listCodeValuesByName } from '@/lib/fineract/system-codes';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import {
  hasActiveCashierSession,
  loadCashierAwarePaymentTypeOptions,
  validateCashTransactionCashierSession
} from '@/lib/fineract/cashier-cash-transaction-guard';
import type { CashierPolicySettings } from '@/lib/fineract/cashier-policy-paths';
import { getCashierPolicySettings } from '@/lib/fineract/cashier-policy';
import { findCurrentUserCashierAssignment } from '@/lib/fineract/current-user-cashier';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import { getServerSession } from '@/lib/session/server';

const LIFECYCLE_PERMISSIONS: Record<SavingsAccountLifecycleCommand, string> = {
  approve: 'APPROVE_SAVINGSACCOUNT',
  activate: 'ACTIVATE_SAVINGSACCOUNT',
  reject: 'REJECT_SAVINGSACCOUNT',
  withdrawnByApplicant: 'WITHDRAW_SAVINGSACCOUNT',
  undoApproval: 'APPROVALUNDO_SAVINGSACCOUNT',
  close: 'CLOSE_SAVINGSACCOUNT',
  block: 'BLOCK_SAVINGSACCOUNT',
  unblock: 'UNBLOCK_SAVINGSACCOUNT',
  blockCredit: 'BLOCKCREDIT_SAVINGSACCOUNT',
  unblockCredit: 'UNBLOCKCREDIT_SAVINGSACCOUNT',
  blockDebit: 'BLOCKDEBIT_SAVINGSACCOUNT',
  unblockDebit: 'UNBLOCKDEBIT_SAVINGSACCOUNT',
  calculateInterest: 'CALCULATEINTEREST_SAVINGSACCOUNT',
  postInterest: 'POSTINTEREST_SAVINGSACCOUNT',
  assignSavingsOfficer: 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT',
  unassignSavingsOfficer: 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT'
};

const DEPOSIT_WITHDRAW_COMMANDS = {
  deposit: 'DEPOSIT_SAVINGSACCOUNT',
  withdrawal: 'WITHDRAWAL_SAVINGSACCOUNT'
} as const;

const EXTENDED_TRANSACTION_PERMISSIONS = {
  postInterestAsOn: 'POSTINTEREST_SAVINGSACCOUNT',
  holdAmount: 'HOLDAMOUNT_SAVINGSACCOUNT'
} as const;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

type ParsedResult<T> = { success: true; data: T } | { success: false; result: SavingsAccountActionResult };

function parseOrError<T>(schema: z.ZodType<T>, raw: unknown): ParsedResult<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      result: {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZod(parsed.error.issues)
      }
    };
  }
  return { success: true, data: parsed.data };
}

type PermissionDenied = Extract<SavingsAccountActionResult, { ok: false }>;

async function requirePermission(
  permission: string,
  deniedMessage: string
): Promise<PermissionDenied | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, permission);
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

async function requireAllPermissions(
  permissions: string[],
  deniedMessage: string
): Promise<PermissionDenied | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, { all: permissions });
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

function revalidateSavingsAccountPaths(clientId: string, accountId: string | number) {
  revalidatePath(`/clients/${clientId}/savings-accounts/${accountId}/general`);
  revalidatePath(`/clients/${clientId}/savings`);
}

function omitEmptyStrings(fields: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && !value.trim()) {
      continue;
    }
    if (value !== undefined) {
      body[key] = value;
    }
  }
  return body;
}

async function rejectCashTransactionWithoutActiveCashier(
  paymentTypeId: number | string | undefined
): Promise<SavingsAccountActionResult | null> {
  if (paymentTypeId == null || paymentTypeId === '') {
    return null;
  }

  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must sign in to continue.' };
  }

  const paymentTypeNumeric =
    typeof paymentTypeId === 'number' ? paymentTypeId : Number(paymentTypeId);
  if (!Number.isFinite(paymentTypeNumeric) || paymentTypeNumeric <= 0) {
    return null;
  }

  const check = await validateCashTransactionCashierSession({
    userId: session.userId,
    officeId: session.officeId,
    paymentTypeId: paymentTypeNumeric
  });
  if (!check.ok) {
    return { ok: false, message: check.message };
  }

  return null;
}

export async function loadSavingsAccountTransactionSheetDataAction(
  accountId: string,
  command: 'deposit' | 'withdrawal'
): Promise<
  | {
      ok: true;
      paymentTypeOptions: CashierAwarePaymentTypeOption[];
      cashierPolicy: CashierPolicySettings;
      activeCashierSession: boolean;
      cashierSessionLink: {
        tellerId: number;
        cashierId: number;
        canOpenCashierDetail: boolean;
      } | null;
    }
  | { ok: false; message: string }
> {
  const permission = DEPOSIT_WITHDRAW_COMMANDS[command];
  const denied = await requirePermission(
    permission,
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const session = await getServerSession();
    const [template, cashierPolicy] = await Promise.all([
      getSavingsAccountTransactionTemplate(accountId, command),
      getCashierPolicySettings()
    ]);
    const paymentTypeOptions = await loadCashierAwarePaymentTypeOptions(
      template.paymentTypeOptions ?? []
    );

    let activeCashierSession = false;
    let cashierSessionLink: {
      tellerId: number;
      cashierId: number;
      canOpenCashierDetail: boolean;
    } | null = null;

    if (session) {
      activeCashierSession = await hasActiveCashierSession({
        userId: session.userId,
        officeId: session.officeId
      });
      const assignment = await findCurrentUserCashierAssignment({
        userId: session.userId,
        officeId: session.officeId
      });
      if (assignment) {
        cashierSessionLink = {
          tellerId: assignment.tellerId,
          cashierId: assignment.cashier.id,
          canOpenCashierDetail: canOpenCashierDetail(session)
        };
      }
    }

    return {
      ok: true,
      paymentTypeOptions,
      cashierPolicy,
      activeCashierSession,
      cashierSessionLink
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load transaction template.');
  }
}

export async function loadSavingsAccountBlockReasonsAction(
  kind: SavingsAccountBlockReasonKind
): Promise<
  | { ok: true; reasons: { id: number; name: string }[]; codeName: string }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'BLOCK_SAVINGSACCOUNT',
    'You do not have permission to block savings accounts.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  const codeName = SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES[kind];

  try {
    const rows = await listCodeValuesByName(codeName);
    const reasons = rows
      .filter((row) => row.active !== false && row.isActive !== false)
      .map((row) => ({ id: row.id, name: row.name }));
    return { ok: true, reasons, codeName };
  } catch (error) {
    return toFineractActionError(error, 'Could not load block reasons.');
  }
}

export async function executeSavingsAccountLifecycleCommandAction(
  clientId: string,
  accountId: string,
  command: SavingsAccountLifecycleCommand,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const permission = LIFECYCLE_PERMISSIONS[command];
  const denied = await requirePermission(permission, 'You do not have permission for this action.');
  if (denied) {
    return denied;
  }

  try {
    let response: unknown;
    switch (command) {
      case 'approve': {
        const parsed = parseOrError(savingsAccountApproveCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              approvedOnDate: parsed.data.approvedOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'activate': {
        const parsed = parseOrError(savingsAccountActivateCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({ activatedOnDate: parsed.data.activatedOnDate })
        );
        break;
      }
      case 'reject': {
        const parsed = parseOrError(savingsAccountRejectCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              rejectedOnDate: parsed.data.rejectedOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'withdrawnByApplicant': {
        const parsed = parseOrError(savingsAccountWithdrawnByApplicantCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              withdrawnOnDate: parsed.data.withdrawnOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'undoApproval': {
        const parsed = parseOrError(savingsAccountUndoApprovalCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        const body = parsed.data.note?.trim() ? { note: parsed.data.note.trim() } : {};
        response = await executeSavingsAccountCommand(accountId, command, body);
        break;
      }
      case 'close': {
        const parsed = parseOrError(savingsAccountCloseCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        if (parsed.data.withdrawBalance && parsed.data.paymentTypeId) {
          const cashierDenied = await rejectCashTransactionWithoutActiveCashier(
            parsed.data.paymentTypeId
          );
          if (cashierDenied) {
            return cashierDenied;
          }
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              closedOnDate: parsed.data.closedOnDate,
              note: parsed.data.note,
              withdrawBalance: parsed.data.withdrawBalance === true,
              paymentTypeId: parsed.data.withdrawBalance ? parsed.data.paymentTypeId : undefined,
              accountNumber: parsed.data.accountNumber,
              checkNumber: parsed.data.checkNumber,
              routingCode: parsed.data.routingCode,
              receiptNumber: parsed.data.receiptNumber,
              bankNumber: parsed.data.bankNumber
            })
          )
        );
        break;
      }
      case 'block':
      case 'blockCredit':
      case 'blockDebit': {
        const parsed = parseOrError(savingsAccountBlockCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({ reasonForBlock: parsed.data.reasonForBlock })
        );
        break;
      }
      case 'unblock':
      case 'unblockCredit':
      case 'unblockDebit': {
        response = await executeSavingsAccountCommand(accountId, command, buildFineractCommandBody({}));
        break;
      }
      case 'calculateInterest':
      case 'postInterest': {
        response = await executeSavingsAccountCommand(accountId, command, buildFineractCommandBody({}));
        break;
      }
      case 'assignSavingsOfficer': {
        const parsed = parseOrError(savingsAccountAssignStaffSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({
            toSavingsOfficerId: parsed.data.toSavingsOfficerId,
            assignmentDate: parsed.data.assignmentDate
          })
        );
        break;
      }
      case 'unassignSavingsOfficer': {
        const parsed = parseOrError(savingsAccountUnassignStaffSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        response = await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({ unassignedDate: parsed.data.unassignedDate })
        );
        break;
      }
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }

    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not complete savings account action.');
  }
}

export async function executeSavingsAccountTransactionCommandAction(
  clientId: string,
  accountId: string,
  command: 'deposit' | 'withdrawal',
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const permission = DEPOSIT_WITHDRAW_COMMANDS[command];
  const denied = await requirePermission(
    permission,
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountTransactionCommandSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  const cashierDenied = await rejectCashTransactionWithoutActiveCashier(parsed.data.paymentTypeId);
  if (cashierDenied) {
    return cashierDenied;
  }

  try {
    const response = await executeSavingsAccountTransaction(
      accountId,
      command,
      buildFineractCommandBody(
        omitEmptyStrings({
          transactionDate: parsed.data.transactionDate,
          transactionAmount: parsed.data.transactionAmount,
          paymentTypeId: parsed.data.paymentTypeId,
          accountNumber: parsed.data.accountNumber,
          checkNumber: parsed.data.checkNumber,
          routingCode: parsed.data.routingCode,
          receiptNumber: parsed.data.receiptNumber,
          bankNumber: parsed.data.bankNumber,
          note: parsed.data.note
        })
      )
    );
    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Could not complete transaction.');
  }
}

export async function loadSavingsAccountAssignStaffSheetDataAction(
  clientId: string
): Promise<
  | { ok: true; staffOptions: { id: number; name: string }[] }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'UPDATESAVINGSOFFICER_SAVINGSACCOUNT',
    'You do not have permission to assign field officers.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const client = await getClientWithTemplate(clientId);
    const staffOptions = client.staffOptions.map((row) => ({
      id: row.id,
      name: row.displayName ?? row.firstname ?? `Staff #${row.id}`
    }));
    return { ok: true, staffOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load field officers.');
  }
}

export async function loadSavingsAccountReassignStaffSheetDataAction(
  clientId: string,
  accountId: string
): Promise<
  | {
      ok: true;
      currentOfficerName: string;
      staffOptions: { id: number; name: string }[];
    }
  | { ok: false; message: string }
> {
  const denied = await requireAllPermissions(
    ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT'],
    'You need permission to assign and remove field officers to reassign.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const [client, account] = await Promise.all([
      getClientWithTemplate(clientId),
      getSavingsAccount(accountId)
    ]);
    if (!account) {
      return { ok: false, message: 'Savings account not found.' };
    }
    const currentOfficerId = account.fieldOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: 'No field officer is assigned.' };
    }
    const currentStaff = client.staffOptions.find((row) => row.id === currentOfficerId);
    const currentOfficerName =
      account.fieldOfficerName?.trim() ||
      currentStaff?.displayName?.trim() ||
      currentStaff?.firstname?.trim() ||
      `Field officer ${currentOfficerId}`;
    const staffOptions = client.staffOptions
      .filter((row) => row.id !== currentOfficerId)
      .map((row) => ({
        id: row.id,
        name: row.displayName ?? row.firstname ?? `Staff #${row.id}`
      }));
    return { ok: true, currentOfficerName, staffOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load field officers.');
  }
}

export async function executeSavingsAccountReassignStaffAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const denied = await requireAllPermissions(
    ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT'],
    'You need permission to assign and remove field officers to reassign.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountAssignStaffSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const account = await getSavingsAccount(accountId);
    if (!account) {
      return { ok: false, message: 'Savings account not found.' };
    }
    const currentOfficerId = account.fieldOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: 'No field officer is assigned.' };
    }
    if (parsed.data.toSavingsOfficerId === currentOfficerId) {
      return {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: { toSavingsOfficerId: 'Select a different field officer.' }
      };
    }

    const reassignmentDate = parsed.data.assignmentDate;
    const response = await executeSavingsAccountCommand(
      accountId,
      'unassignSavingsOfficer',
      buildFineractCommandBody({ unassignedDate: reassignmentDate })
    );
    await executeSavingsAccountCommand(
      accountId,
      'assignSavingsOfficer',
      buildFineractCommandBody({
        toSavingsOfficerId: parsed.data.toSavingsOfficerId,
        assignmentDate: reassignmentDate
      })
    );
    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not reassign field officer.');
  }
}

export async function loadSavingsAccountHoldReasonsAction(): Promise<
  | { ok: true; reasons: { id: number; name: string }[]; codeName: string }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'HOLDAMOUNT_SAVINGSACCOUNT',
    'You do not have permission to hold amounts on savings accounts.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const rows = await listCodeValuesByName(SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME);
    const reasons = rows
      .filter((row) => row.active !== false && row.isActive !== false)
      .map((row) => ({ id: row.id, name: row.name }));
    return { ok: true, reasons, codeName: SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME };
  } catch (error) {
    return toFineractActionError(error, 'Could not load hold reasons.');
  }
}

export async function loadSavingsAccountAddChargeSheetDataAction(accountId: string): Promise<
  | { ok: true; chargeOptions: { id: number; name: string }[] }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'CREATE_SAVINGSACCOUNTCHARGE',
    'You do not have permission to add charges.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const template = await getSavingsAccountChargeTemplate(accountId);
    return { ok: true, chargeOptions: template.chargeOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load charge options.');
  }
}

export async function loadSavingsAccountChargeDetailAction(chargeId: string): Promise<
  | {
      ok: true;
      detail: {
        id: number;
        name?: string;
        amount?: number;
        feeInterval?: number;
        currencyCode?: string;
        chargeTimeType?: { id: number; value?: string; code?: string };
        chargeCalculationType?: { id: number; value?: string; code?: string };
      };
    }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'CREATE_SAVINGSACCOUNTCHARGE',
    'You do not have permission to add charges.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const detail = await getSavingsAccountChargeDetailTemplate(chargeId);
    if (!detail) {
      return { ok: false, message: 'Charge not found.' };
    }
    return { ok: true, detail };
  } catch (error) {
    return toFineractActionError(error, 'Could not load charge details.');
  }
}

export async function loadSavingsAccountAnnualFeeSheetDataAction(accountId: string): Promise<
  | { ok: true; chargeId: number; chargeName: string; amount?: number }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'APPLYANNUALFEE_SAVINGSACCOUNT',
    'You do not have permission to apply annual fees.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const account = await getSavingsAccount(accountId);
    if (!account) {
      return { ok: false, message: 'Savings account not found.' };
    }
    const charge = savingsAccountAnnualFeeCharge(account);
    if (!charge) {
      return { ok: false, message: 'No annual fee charge is configured on this account.' };
    }
    return {
      ok: true,
      chargeId: charge.id,
      chargeName: charge.name,
      amount: charge.amount
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load annual fee details.');
  }
}

export async function executeSavingsAccountExtendedTransactionCommandAction(
  clientId: string,
  accountId: string,
  command: keyof typeof EXTENDED_TRANSACTION_PERMISSIONS,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const permission = EXTENDED_TRANSACTION_PERMISSIONS[command];
  const denied = await requirePermission(permission, 'You do not have permission for this action.');
  if (denied) {
    return denied;
  }

  try {
    let response: unknown;
    if (command === 'postInterestAsOn') {
      const parsed = parseOrError(savingsAccountPostInterestAsOnSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      response = await executeSavingsAccountTransaction(
        accountId,
        command,
        buildFineractCommandBody({
          transactionDate: parsed.data.transactionDate,
          IsPostInterestAsOn: true
        })
      );
    } else {
      const parsed = parseOrError(savingsAccountHoldAmountSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      response = await executeSavingsAccountTransaction(
        accountId,
        command,
        buildFineractCommandBody({
          reasonForBlock: parsed.data.reasonForBlock,
          transactionDate: parsed.data.transactionDate,
          transactionAmount: parsed.data.transactionAmount
        })
      );
    }

    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not complete savings account action.');
  }
}

export async function executeSavingsAccountAddChargeAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const denied = await requirePermission(
    'CREATE_SAVINGSACCOUNTCHARGE',
    'You do not have permission to add charges.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountAddChargeSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await createSavingsAccountCharge(
      accountId,
      buildFineractCommandBody(
        omitEmptyStrings({
          chargeId: parsed.data.chargeId,
          amount: parsed.data.amount,
          dueDate: parsed.data.dueDate,
          feeOnMonthDay: parsed.data.feeOnMonthDay,
          feeInterval: parsed.data.feeInterval
        })
      )
    );
    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not add charge.');
  }
}

export async function executeSavingsAccountPayChargeAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const denied = await requirePermission(
    'APPLYANNUALFEE_SAVINGSACCOUNT',
    'You do not have permission to apply annual fees.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountPayChargeSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeSavingsAccountChargeCommand(
      accountId,
      parsed.data.chargeId,
      'paycharge',
      buildFineractCommandBody(
        omitEmptyStrings({
          dueDate: parsed.data.dueDate,
          amount: parsed.data.amount
        })
      )
    );
    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not apply annual fee.');
  }
}

export async function executeSavingsAccountDeleteAction(
  clientId: string,
  accountId: string
): Promise<SavingsAccountActionResult> {
  const denied = await requirePermission(
    'DELETE_SAVINGSACCOUNT',
    'You do not have permission to delete savings accounts.'
  );
  if (denied) {
    return denied;
  }

  try {
    const response = await deleteSavingsAccount(accountId);
    revalidatePath(`/clients/${clientId}/savings`);
    revalidatePath(`/clients/${clientId}/savings-accounts/${accountId}/general`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not delete savings account.');
  }
}

export async function executeSavingsAccountWithholdTaxAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const denied = await requirePermission(
    'UPDATEWITHHOLDTAX_SAVINGSACCOUNT',
    'You do not have permission to update withhold tax.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountWithholdTaxSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await updateSavingsAccountWithholdTax(accountId, parsed.data.withHoldTax);
    revalidateSavingsAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not update withhold tax.');
  }
}

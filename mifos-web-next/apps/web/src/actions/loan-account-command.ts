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
  loanAccountApproveCommandSchema,
  loanAccountDisburseCommandSchema,
  loanAccountDisburseToSavingsCommandSchema,
  loanAccountRejectCommandSchema,
  loanAccountTransactionCommandSchema,
  loanAccountWriteOffCommandSchema,
  loanAccountUndoApprovalCommandSchema,
  loanAccountUndoDisbursalCommandSchema,
  loanAccountWithdrawnCommandSchema,
  loanAccountAddChargeSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import { normalizeFineractDateField, parseFineractDateString, toFineractDate } from '@/lib/fineract/dates';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  LOAN_DELETE_PERMISSION,
  LOAN_ADD_CHARGE_PERMISSION,
  LOAN_LIFECYCLE_COMMAND_PERMISSIONS,
  LOAN_TRANSACTION_COMMAND_PERMISSIONS,
  type LoanAccountLifecycleCommand,
  type LoanAccountTransactionCommand
} from '@/lib/fineract/loan-account-command-meta';
import {
  deleteLoanAccount,
  createLoanAccountCharge,
  getLoanAccountChargeTemplate,
  executeLoanAccountLifecycleCommand,
  executeLoanAccountTransactionCommand,
  getLoanAccountApprovalTemplate,
  getLoanAccountTransactionTemplate
} from '@/lib/fineract/loan-account-commands';
import { loadCashierAwarePaymentTypeOptions } from '@/lib/fineract/cashier-cash-transaction-guard';
import { chargeExpectsDueDate } from '@/lib/fineract/loan-application-charges';
import { getServerSession } from '@/lib/session/server';

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

type ParsedResult<T> = { success: true; data: T } | { success: false; result: LoanAccountActionResult };

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

async function requirePermission(
  permission: string,
  deniedMessage: string
): Promise<{ ok: false; message: string; fieldErrors?: Record<string, string> } | null> {
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

function revalidateLoanAccountPaths(clientId: string, accountId: string) {
  revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
  revalidatePath(`/clients/${clientId}/loans`);
}

function omitEmptyStrings(fields: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    result[key] = value;
  }
  return result;
}

export async function loadLoanAccountApproveSheetDataAction(
  accountId: string
): Promise<
  | {
      ok: true;
      approvalAmount?: number;
      expectedDisbursementDate?: string;
    }
  | Extract<LoanAccountActionResult, { ok: false }>
> {
  const denied = await requirePermission(
    LOAN_LIFECYCLE_COMMAND_PERMISSIONS.approve,
    'You do not have permission to approve loans.'
  );
  if (denied) {
    return denied;
  }

  try {
    const template = await getLoanAccountApprovalTemplate(accountId);
    return {
      ok: true,
      approvalAmount: template.approvalAmount,
      expectedDisbursementDate: template.expectedDisbursementDate
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load approval details.');
  }
}

export async function loadLoanAccountDisburseSheetDataAction(
  accountId: string,
  command: 'disburse' | 'disburseToSavings'
): Promise<
  | {
      ok: true;
      amount?: number;
      paymentTypeOptions: Awaited<ReturnType<typeof loadCashierAwarePaymentTypeOptions>>;
    }
  | Extract<LoanAccountActionResult, { ok: false }>
> {
  const permission =
    command === 'disburse'
      ? LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disburse
      : LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disbursetosavings;
  const denied = await requirePermission(permission, 'You do not have permission to disburse this loan.');
  if (denied) {
    return denied;
  }

  try {
    const template = await getLoanAccountTransactionTemplate(
      accountId,
      command === 'disburse' ? 'disburse' : 'disburseToSavings'
    );
    const paymentTypeOptions = await loadCashierAwarePaymentTypeOptions(
      template.paymentTypeOptions ?? []
    );
    return {
      ok: true,
      amount: template.amount,
      paymentTypeOptions
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load disbursement details.');
  }
}

export async function loadLoanAccountTransactionSheetDataAction(
  accountId: string,
  command: LoanAccountTransactionCommand
): Promise<
  | {
      ok: true;
      amount?: number;
      paymentTypeOptions: Awaited<ReturnType<typeof loadCashierAwarePaymentTypeOptions>>;
      writeOffReasonOptions: { id: number; name: string }[];
    }
  | Extract<LoanAccountActionResult, { ok: false }>
> {
  const denied = await requirePermission(
    LOAN_TRANSACTION_COMMAND_PERMISSIONS[command],
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return denied;
  }

  try {
    const template = await getLoanAccountTransactionTemplate(accountId, command);
    const paymentTypeOptions = await loadCashierAwarePaymentTypeOptions(
      template.paymentTypeOptions ?? []
    );
    return {
      ok: true,
      amount: template.amount,
      paymentTypeOptions,
      writeOffReasonOptions: template.writeOffReasonOptions ?? []
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load transaction details.');
  }
}

export async function executeLoanAccountLifecycleCommandAction(
  clientId: string,
  accountId: string,
  command: Extract<
    LoanAccountLifecycleCommand,
    'reject' | 'withdrawnByApplicant' | 'undoapproval' | 'undodisbursal'
  >,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    LOAN_LIFECYCLE_COMMAND_PERMISSIONS[command],
    'You do not have permission to perform this action.'
  );
  if (denied) {
    return denied;
  }

  const schema =
    command === 'reject'
      ? loanAccountRejectCommandSchema
      : command === 'withdrawnByApplicant'
        ? loanAccountWithdrawnCommandSchema
        : command === 'undoapproval'
          ? loanAccountUndoApprovalCommandSchema
          : loanAccountUndoDisbursalCommandSchema;

  const parsed = parseOrError(schema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeLoanAccountLifecycleCommand(
      accountId,
      command,
      buildFineractCommandBody(parsed.data as Record<string, unknown>)
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not complete this action.');
  }
}

export async function executeLoanAccountApproveAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    LOAN_LIFECYCLE_COMMAND_PERMISSIONS.approve,
    'You do not have permission to approve loans.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanAccountApproveCommandSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const { approvedOnDate, expectedDisbursementDate, approvedLoanAmount, note } = parsed.data;
    const normalizedExpected = expectedDisbursementDate
      ? (() => {
          const parsed = parseFineractDateString(expectedDisbursementDate);
          return parsed ? toFineractDate(parsed) : undefined;
        })()
      : undefined;
    const response = await executeLoanAccountLifecycleCommand(
      accountId,
      'approve',
      buildFineractCommandBody(
        omitEmptyStrings({
          approvedOnDate: normalizeFineractDateField(approvedOnDate) ?? approvedOnDate,
          expectedDisbursementDate: normalizedExpected,
          approvedLoanAmount,
          note
        })
      )
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not approve this loan.');
  }
}

export async function executeLoanAccountDisburseAction(
  clientId: string,
  accountId: string,
  command: 'disburse' | 'disbursetosavings',
  raw: unknown
): Promise<LoanAccountActionResult> {
  const permission =
    command === 'disburse'
      ? LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disburse
      : LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disbursetosavings;
  const denied = await requirePermission(permission, 'You do not have permission to disburse this loan.');
  if (denied) {
    return denied;
  }

  const schema =
    command === 'disburse'
      ? loanAccountDisburseCommandSchema
      : loanAccountDisburseToSavingsCommandSchema;
  const parsed = parseOrError(schema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeLoanAccountLifecycleCommand(
      accountId,
      command,
      buildFineractCommandBody(parsed.data as Record<string, unknown>)
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not disburse this loan.');
  }
}

export async function executeLoanAccountTransactionCommandAction(
  clientId: string,
  accountId: string,
  command: LoanAccountTransactionCommand,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    LOAN_TRANSACTION_COMMAND_PERMISSIONS[command],
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return denied;
  }

  const schema =
    command === 'writeoff' ? loanAccountWriteOffCommandSchema : loanAccountTransactionCommandSchema;
  const parsed = parseOrError(schema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  const body = { ...(parsed.data as Record<string, unknown>) };

  try {
    const response = await executeLoanAccountTransactionCommand(
      accountId,
      command,
      buildFineractCommandBody(body)
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not post this transaction.');
  }
}

export async function executeLoanAccountDeleteAction(
  clientId: string,
  accountId: string
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    LOAN_DELETE_PERMISSION,
    'You do not have permission to delete loans.'
  );
  if (denied) {
    return denied;
  }

  try {
    await deleteLoanAccount(accountId);
    revalidatePath(`/clients/${clientId}/loans`);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not delete this loan.');
  }
}

export async function loadLoanAccountAddChargeSheetDataAction(accountId: string): Promise<
  | {
      ok: true;
      chargeOptions: {
        id: number;
        name: string;
        amount?: number;
        amountOrPercentage?: number;
        percentage?: number;
        currencyCode?: string;
        chargeCalculationType?: { id: number; value?: string; code?: string };
        chargeTimeType?: { id: number; value?: string; code?: string };
      }[];
    }
  | Extract<LoanAccountActionResult, { ok: false }>
> {
  const denied = await requirePermission(
    LOAN_ADD_CHARGE_PERMISSION,
    'You do not have permission to add charges.'
  );
  if (denied) {
    return denied;
  }

  try {
    const template = await getLoanAccountChargeTemplate(accountId);
    return { ok: true, chargeOptions: template.chargeOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load charge options.');
  }
}

export async function executeLoanAccountAddChargeAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    LOAN_ADD_CHARGE_PERMISSION,
    'You do not have permission to add charges.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanAccountAddChargeSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const template = await getLoanAccountChargeTemplate(accountId);
    const charge = template.chargeOptions.find((option) => option.id === parsed.data.chargeId);
    if (!charge) {
      return { ok: false, message: 'Selected charge is not available for this loan.' };
    }
    if (chargeExpectsDueDate(charge) && !parsed.data.dueDate?.trim()) {
      return {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: { dueDate: 'Due date is required.' }
      };
    }

    const response = await createLoanAccountCharge(
      accountId,
      buildFineractCommandBody(
        omitEmptyStrings({
          chargeId: parsed.data.chargeId,
          amount: parsed.data.amount,
          dueDate: parsed.data.dueDate
        })
      )
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not add charge.');
  }
}

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
  depositAccountActivateCommandSchema,
  depositAccountApproveCommandSchema,
  depositAccountCalculatePrematureAmountSchema,
  depositAccountCloseCommandSchema,
  depositAccountPrematureCloseCommandSchema,
  depositAccountRejectCommandSchema,
  depositAccountTransactionCommandSchema,
  depositAccountUndoActivationCommandSchema,
  depositAccountUndoApprovalCommandSchema,
  depositAccountWithdrawnByApplicantCommandSchema,
  savingsAccountAddChargeSchema,
  savingsAccountUndoTransactionSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand,
  validateSavingsAccountCashTransaction
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  buildFineractCommandBody,
  buildFineractNoteCommandBody
} from '@/lib/fineract/client-command-body';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import {
  hasActiveCashierSession,
  loadCashierAwarePaymentTypeOptions,
  validateCashTransactionCashierSession
} from '@/lib/fineract/cashier-cash-transaction-guard';
import type { CashierPolicySettings } from '@/lib/fineract/cashier-policy-paths';
import { getCashierPolicySettings } from '@/lib/fineract/cashier-policy';
import { findCurrentUserCashierAssignment } from '@/lib/fineract/current-user-cashier';
import {
  calculateDepositAccountPrematureAmount,
  deleteDepositAccount,
  executeDepositAccountExistingTransaction,
  executeDepositAccountLifecycleCommand,
  executeDepositAccountTransaction,
  getDepositAccountCloseTemplate,
  getDepositAccountTransactionTemplate,
  getTermDepositAccount,
  type DepositAccountClosureTemplate,
  type DepositAccountLifecycleCommand,
  type DepositAccountTransactionCommand
} from '@/lib/fineract/deposit-account-commands';
import {
  depositAccountKindLabel,
  depositAccountPermission,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import { listActiveCurrencyLegalTenders } from '@/lib/fineract/legal-tenders';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import {
  createSavingsAccountCharge,
  getSavingsAccountChargeDetailTemplate,
  getSavingsAccountChargeTemplate
} from '@/lib/fineract/savings-account-commands';
import type { SavingsAccountActionResult } from '@/lib/fineract/savings-account-action-result';
import { getServerSession } from '@/lib/session/server';

type DepositAccountActionResult = SavingsAccountActionResult;

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

type ParsedResult<T> =
  | { success: true; data: T }
  | { success: false; result: DepositAccountActionResult };

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

type PermissionDenied = Extract<DepositAccountActionResult, { ok: false }>;

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

function revalidateDepositAccountPaths(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string | number
) {
  const segment =
    kind === 'fixedDeposit' ? 'fixed-deposits-accounts' : 'recurring-deposits-accounts';
  const listSegment = kind === 'fixedDeposit' ? 'fixed-deposits' : 'recurring-deposits';
  revalidatePath(`/clients/${clientId}/${segment}/${accountId}/general`);
  revalidatePath(`/clients/${clientId}/${listSegment}`);
}

function omitEmptyStrings(fields: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && !value.trim()) {
      continue;
    }
    body[key] = value;
  }
  return body;
}

function fieldErrorsFromZodError(error: z.ZodError): Record<string, string> {
  return fieldErrorsFromZod(error.issues);
}

async function resolveCurrencyDecimalPlaces(currencyCode: string): Promise<number> {
  const currencies = await getOrganizationSelectedCurrencies();
  return currencies.find((row) => row.code === currencyCode)?.decimalPlaces ?? 2;
}

function paymentTypeOptionsFromTemplate(template: unknown): Array<{
  id: number;
  name: string;
  isSystemDefined?: boolean;
}> {
  if (!template || typeof template !== 'object') {
    return [];
  }
  const options = (template as { paymentTypeOptions?: unknown }).paymentTypeOptions;
  if (!Array.isArray(options)) {
    return [];
  }
  const rows: Array<{ id: number; name: string; isSystemDefined?: boolean }> = [];
  for (const item of options) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'number' ? row.id : Number(row.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    const name =
      typeof row.name === 'string'
        ? row.name
        : typeof row.value === 'string'
          ? row.value
          : String(id);
    rows.push({
      id,
      name,
      isSystemDefined: row.isSystemDefined === true
    });
  }
  return rows;
}

async function rejectCashTransactionWithoutActiveCashier(
  paymentTypeId: number | string | undefined
): Promise<DepositAccountActionResult | null> {
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

const LIFECYCLE_PERMISSION_ACTION: Record<DepositAccountLifecycleCommand, string> = {
  approve: 'APPROVE',
  activate: 'ACTIVATE',
  reject: 'REJECT',
  withdrawnByApplicant: 'WITHDRAW',
  undoApproval: 'APPROVALUNDO',
  undoActivation: 'UNDO_ACTIVATE',
  calculateInterest: 'CALCULATEINTEREST',
  postInterest: 'POSTINTEREST',
  prematureClose: 'PREMATURECLOSE',
  close: 'CLOSE'
};

function lifecyclePermission(kind: TermDepositAccountKind, command: DepositAccountLifecycleCommand) {
  return depositAccountPermission(kind, LIFECYCLE_PERMISSION_ACTION[command]);
}

export async function executeDepositAccountLifecycleCommandAction(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string,
  command: DepositAccountLifecycleCommand,
  raw: unknown
): Promise<DepositAccountActionResult> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    lifecyclePermission(kind, command),
    `You do not have permission for this ${label} action.`
  );
  if (denied) {
    return denied;
  }

  try {
    let body: Record<string, unknown> = {};

    if (command === 'approve') {
      const parsed = parseOrError(depositAccountApproveCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(omitEmptyStrings(parsed.data));
    } else if (command === 'activate') {
      const parsed = parseOrError(depositAccountActivateCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(parsed.data);
    } else if (command === 'reject') {
      const parsed = parseOrError(depositAccountRejectCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(omitEmptyStrings(parsed.data));
    } else if (command === 'withdrawnByApplicant') {
      const parsed = parseOrError(depositAccountWithdrawnByApplicantCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(omitEmptyStrings(parsed.data));
    } else if (command === 'undoApproval') {
      const parsed = parseOrError(depositAccountUndoApprovalCommandSchema, raw ?? {});
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractNoteCommandBody(parsed.data.note);
    } else if (command === 'undoActivation') {
      const parsed = parseOrError(depositAccountUndoActivationCommandSchema, raw ?? {});
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractNoteCommandBody(parsed.data.note);
    } else if (command === 'prematureClose') {
      const parsed = parseOrError(depositAccountPrematureCloseCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(omitEmptyStrings(parsed.data));
    } else if (command === 'close') {
      const parsed = parseOrError(depositAccountCloseCommandSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody(omitEmptyStrings(parsed.data));
    }

    const result = await executeDepositAccountLifecycleCommand(kind, accountId, command, body);
    revalidateDepositAccountPaths(kind, clientId, accountId);
    return actionSuccessFromFineractCommand(result);
  } catch (error) {
    return toFineractActionError(error, `Could not complete the ${label} action.`);
  }
}

export async function executeDepositAccountDeleteAction(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string
): Promise<DepositAccountActionResult> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    depositAccountPermission(kind, 'DELETE'),
    `You do not have permission to delete this ${label}.`
  );
  if (denied) {
    return denied;
  }

  try {
    const result = await deleteDepositAccount(kind, accountId);
    revalidateDepositAccountPaths(kind, clientId, accountId);
    return actionSuccessFromFineractCommand(result);
  } catch (error) {
    return toFineractActionError(error, `Could not delete the ${label}.`);
  }
}

export async function calculateDepositAccountPrematureAmountAction(
  kind: TermDepositAccountKind,
  accountId: string,
  raw: unknown
): Promise<
  | { ok: true; data: DepositAccountClosureTemplate }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    depositAccountPermission(kind, 'PREMATURECLOSE'),
    `You do not have permission to prematurely close this ${label}.`
  );
  if (denied) {
    return denied;
  }

  const parsed = depositAccountCalculatePrematureAmountSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues)
    };
  }

  try {
    const data = await calculateDepositAccountPrematureAmount(
      kind,
      accountId,
      buildFineractCommandBody(parsed.data)
    );
    return { ok: true, data };
  } catch (error) {
    const mapped = toFineractActionError(error, `Could not calculate the premature close amount.`);
    return { ok: false, message: mapped.message, fieldErrors: mapped.fieldErrors };
  }
}

export async function loadDepositAccountCloseTemplateAction(
  kind: TermDepositAccountKind,
  accountId: string
): Promise<
  | { ok: true; data: DepositAccountClosureTemplate }
  | { ok: false; message: string }
> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    depositAccountPermission(kind, 'CLOSE'),
    `You do not have permission to close this ${label}.`
  );
  if (denied) {
    return denied;
  }

  try {
    const data = await getDepositAccountCloseTemplate(kind, accountId);
    return { ok: true, data };
  } catch (error) {
    const mapped = toFineractActionError(error, `Could not load close options.`);
    return { ok: false, message: mapped.message };
  }
}

export async function loadDepositAccountTransactionSheetDataAction(
  kind: TermDepositAccountKind,
  accountId: string,
  command: DepositAccountTransactionCommand,
  currencyCode: string
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
      legalTenders: Awaited<ReturnType<typeof listActiveCurrencyLegalTenders>>;
      decimalPlaces: number;
    }
  | { ok: false; message: string }
> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    depositAccountPermission(kind, command === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'),
    `You do not have permission for this ${label} transaction.`
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const session = await getServerSession();
    const trimmedCurrency = currencyCode.trim();
    const [template, cashierPolicy, decimalPlaces] = await Promise.all([
      getDepositAccountTransactionTemplate(kind, accountId, command),
      getCashierPolicySettings(),
      resolveCurrencyDecimalPlaces(trimmedCurrency)
    ]);
    const paymentTypeOptions = await loadCashierAwarePaymentTypeOptions(
      paymentTypeOptionsFromTemplate(template)
    );

    let legalTenders: Awaited<ReturnType<typeof listActiveCurrencyLegalTenders>> = [];
    if (trimmedCurrency && cashierPolicy.captureLegalTenderForCashTransactions !== 'OFF') {
      try {
        legalTenders = await listActiveCurrencyLegalTenders(trimmedCurrency);
      } catch {
        legalTenders = [];
      }
    }

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
      cashierSessionLink,
      legalTenders,
      decimalPlaces
    };
  } catch (error) {
    const mapped = toFineractActionError(error, 'Could not load the transaction form.');
    return { ok: false, message: mapped.message };
  }
}

export async function executeDepositAccountTransactionAction(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string,
  command: DepositAccountTransactionCommand,
  raw: unknown
): Promise<DepositAccountActionResult> {
  const label = depositAccountKindLabel(kind);
  const denied = await requirePermission(
    depositAccountPermission(kind, command === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'),
    `You do not have permission for this ${label} transaction.`
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(depositAccountTransactionCommandSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  const cashierDenied = await rejectCashTransactionWithoutActiveCashier(parsed.data.paymentTypeId);
  if (cashierDenied) {
    return cashierDenied;
  }

  try {
    const account = await getTermDepositAccount(kind, accountId);
    if (!account) {
      return { ok: false, message: `${label} account not found.` };
    }
    const accountCurrencyCode = account.currency?.code?.trim() ?? '';

    const [template, cashierPolicy] = await Promise.all([
      getDepositAccountTransactionTemplate(kind, accountId, command),
      getCashierPolicySettings()
    ]);
    const paymentTypeOptions = await loadCashierAwarePaymentTypeOptions(
      paymentTypeOptionsFromTemplate(template)
    );
    const isCashPayment =
      paymentTypeOptions.find((row) => row.id === parsed.data.paymentTypeId)?.isCashPayment ===
      true;

    let decimalPlaces = 2;
    let activeTenders: Awaited<ReturnType<typeof listActiveCurrencyLegalTenders>> = [];
    if (isCashPayment && cashierPolicy.captureLegalTenderForCashTransactions !== 'OFF') {
      decimalPlaces = await resolveCurrencyDecimalPlaces(accountCurrencyCode);
      if (accountCurrencyCode) {
        try {
          activeTenders = await listActiveCurrencyLegalTenders(accountCurrencyCode);
        } catch {
          activeTenders = [];
        }
      }
    }

    const validated = validateSavingsAccountCashTransaction(parsed.data, {
      isCashPayment,
      captureMode: cashierPolicy.captureLegalTenderForCashTransactions,
      activeTenders,
      decimalPlaces
    });
    if (!validated.success) {
      return {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZodError(validated.error)
      };
    }

    const result = await executeDepositAccountTransaction(
      kind,
      accountId,
      command,
      buildFineractCommandBody(
        omitEmptyStrings({
          transactionDate: validated.data.transactionDate,
          transactionAmount: validated.data.transactionAmount,
          paymentTypeId: validated.data.paymentTypeId,
          accountNumber: validated.data.accountNumber,
          checkNumber: validated.data.checkNumber,
          routingCode: validated.data.routingCode,
          receiptNumber: validated.data.receiptNumber,
          bankNumber: validated.data.bankNumber,
          note: validated.data.note,
          ...(validated.data.legalTenderLines?.length
            ? { legalTenderLines: validated.data.legalTenderLines }
            : {})
        })
      )
    );
    revalidateDepositAccountPaths(kind, clientId, accountId);
    return actionSuccessFromFineractCommand(result, { resourceId: result.resourceId });
  } catch (error) {
    return toFineractActionError(error, `Could not post the ${command}.`);
  }
}

export async function loadDepositAccountAddChargeSheetDataAction(
  accountId: string
): Promise<
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

export async function loadDepositAccountChargeDetailAction(chargeId: string): Promise<
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

export async function executeDepositAccountAddChargeAction(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<DepositAccountActionResult> {
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
    revalidateDepositAccountPaths(kind, clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not add charge.');
  }
}

export async function undoDepositAccountTransactionAction(
  kind: TermDepositAccountKind,
  raw: unknown
): Promise<DepositAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = savingsAccountUndoTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid transaction undo request.' };
  }

  try {
    assertCan(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT');
  } catch {
    try {
      assertCan(session, 'UNDOTRANSACTION_SAVINGSACCOUNT');
    } catch {
      return { ok: false, message: 'You do not have permission to undo this transaction.' };
    }
  }

  const { clientId, accountId, transactionId, transactionDate } = parsed.data;

  try {
    const response = await executeDepositAccountExistingTransaction(
      kind,
      accountId,
      transactionId,
      'undo',
      buildFineractCommandBody({
        transactionDate,
        transactionAmount: 0
      })
    );
    revalidateDepositAccountPaths(kind, clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not undo transaction.');
  }
}

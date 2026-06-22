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
  savingsAccountModifyTransactionSchema,
  savingsAccountUndoTransactionSchema,
  toFineractActionError,
  undoAccountTransferCommandSchema
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { undoAccountTransfer } from '@/lib/fineract/account-transfers';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import {
  executeSavingsAccountExistingTransaction,
  getSavingsAccountTransactionModifyTemplate
} from '@/lib/fineract/savings-account-commands';
import type { SavingsAccountActionResult } from '@/lib/fineract/savings-account-action-result';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import {
  paymentTypeOptionsIncludingSelected,
  resolvePaymentTypeId
} from '@/lib/fineract/savings-payment-type-options';
import { getServerSession } from '@/lib/session/server';

function revalidateSavingsTransactionPaths(
  clientId: string,
  accountId: string | number,
  transactionId?: string | number
) {
  revalidatePath(`/clients/${clientId}/savings-accounts/${accountId}/general`);
  revalidatePath(`/clients/${clientId}/savings`);
  if (transactionId != null) {
    revalidatePath(
      `/clients/${clientId}/savings-accounts/${accountId}/transactions/${transactionId}`
    );
  }
}

export async function undoSavingsTransactionAction(
  raw: unknown
): Promise<SavingsAccountActionResult> {
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
    await executeSavingsAccountExistingTransaction(
      accountId,
      transactionId,
      'undo',
      buildFineractCommandBody({
        transactionDate,
        transactionAmount: 0
      })
    );
    revalidateSavingsTransactionPaths(clientId, accountId, transactionId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not undo transaction.');
  }
}

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

export async function loadSavingsTransactionEditSheetDataAction(
  accountId: string,
  transactionId: number
): Promise<
  | {
      ok: true;
      paymentTypeOptions: { id: number; name: string }[];
      transactionDate: string;
      transactionAmount: string;
      paymentTypeId: string;
      note: string;
      paymentDetails: {
        accountNumber: string;
        checkNumber: string;
        routingCode: string;
        receiptNumber: string;
        bankNumber: string;
      };
    }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to edit this transaction.' };
  }

  try {
    const template = await getSavingsAccountTransactionModifyTemplate(accountId, transactionId);
    const paymentTypeId = resolvePaymentTypeId(
      template.paymentTypeId,
      template.paymentDetailData?.paymentType?.id
    );
    const paymentTypeOptions = paymentTypeOptionsIncludingSelected(
      template.paymentTypeOptions ?? [],
      paymentTypeId,
      template.paymentDetailData?.paymentType?.name
    );
    const transactionDate =
      fineractApiDateToFormString(template.date) ??
      fineractApiDateToFormString([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]) ??
      '';
    const payment = template.paymentDetailData;
    return {
      ok: true,
      paymentTypeOptions,
      transactionDate,
      transactionAmount:
        template.amount != null && Number.isFinite(template.amount) ? String(template.amount) : '',
      paymentTypeId: paymentTypeId != null ? String(paymentTypeId) : '',
      note: template.note?.trim() ?? '',
      paymentDetails: {
        accountNumber: payment?.accountNumber ?? '',
        checkNumber: payment?.checkNumber ?? '',
        routingCode: payment?.routingCode ?? '',
        receiptNumber: payment?.receiptNumber ?? '',
        bankNumber: payment?.bankNumber ?? ''
      }
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load transaction for editing.');
  }
}

export async function modifySavingsTransactionAction(
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = savingsAccountModifyTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues)
    };
  }

  try {
    assertCan(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to edit this transaction.' };
  }

  const { clientId, accountId, transactionId, ...fields } = parsed.data;

  try {
    await executeSavingsAccountExistingTransaction(
      accountId,
      transactionId,
      'modify',
      buildFineractCommandBody(
        omitEmptyStrings({
          transactionDate: fields.transactionDate,
          transactionAmount: fields.transactionAmount,
          paymentTypeId: fields.paymentTypeId,
          note: fields.note,
          accountNumber: fields.accountNumber,
          checkNumber: fields.checkNumber,
          routingCode: fields.routingCode,
          receiptNumber: fields.receiptNumber,
          bankNumber: fields.bankNumber
        })
      )
    );
    revalidateSavingsTransactionPaths(clientId, accountId, transactionId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not update transaction.');
  }
}

export async function undoAccountTransferAction(
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = undoAccountTransferCommandSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid transfer undo request.' };
  }

  try {
    assertCan(session, 'ADJUST_ACCOUNTTRANSFER');
  } catch {
    return { ok: false, message: 'You do not have permission to undo this transfer.' };
  }

  const { clientId, accountId, transferId } = parsed.data;

  try {
    await undoAccountTransfer(transferId);
    revalidateSavingsTransactionPaths(clientId, accountId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not undo transfer.');
  }
}

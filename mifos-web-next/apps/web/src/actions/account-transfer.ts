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
  createAccountTransferSchema,
  toFineractActionError,
  type CreateAccountTransferInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import type { AccountTransferTemplate } from '@mifos/api-client';
import { revalidatePath } from 'next/cache';
import type {
  AccountTransferActionResult,
  AccountTransferTemplateResult
} from '@/lib/fineract/account-transfer-action-result';
import {
  accountTransferAvailableBalance,
  buildCreateAccountTransferBody,
  createAccountTransfer,
  getAccountTransferTemplate,
  SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
  type AccountTransferTemplateQuery
} from '@/lib/fineract/account-transfers';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';
import { savingsAccountAvailableBalance } from '@/lib/fineract/savings-account-display';
import {
  resolveTransferBeneficiaryClient,
  searchTransferBeneficiaryClients
} from '@/lib/fineract/transfer-beneficiary-clients';
import type {
  TransferBeneficiaryClientResolved,
  TransferBeneficiaryClientSummary
} from '@/lib/fineract/transfer-beneficiary-clients.types';
import { getServerSession } from '@/lib/session/server';

function parseTransferInput(raw: unknown):
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
  | { ok: true; data: CreateAccountTransferInput } {
  const parsed = createAccountTransferSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return { ok: true, data: parsed.data };
}

function revalidateSavingsAccountPaths(clientId: string, accountId: string | number) {
  revalidatePath(`/clients/${clientId}/savings-accounts/${accountId}/general`);
  revalidatePath(`/clients/${clientId}/savings`);
}

export async function fetchAccountTransferTemplateAction(
  query: AccountTransferTemplateQuery
): Promise<AccountTransferTemplateResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');
    return await getAccountTransferTemplate(query);
  } catch (err) {
    return toFineractActionError(err, 'Could not load transfer options.');
  }
}

export async function searchTransferBeneficiaryClientsAction(
  query: string
): Promise<
  | { ok: true; data: TransferBeneficiaryClientSummary[] }
  | Extract<AccountTransferActionResult, { ok: false }>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');
    const data = await searchTransferBeneficiaryClients(query);
    return { ok: true, data };
  } catch (err) {
    return toFineractActionError(err, 'Could not search customers.');
  }
}

export async function resolveTransferBeneficiaryClientAction(
  beneficiaryClientId: string | number
): Promise<
  | { ok: true; data: TransferBeneficiaryClientResolved }
  | Extract<AccountTransferActionResult, { ok: false }>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');
    const data = await resolveTransferBeneficiaryClient(beneficiaryClientId);
    return { ok: true, data };
  } catch (err) {
    return toFineractActionError(err, 'Could not load the selected customer.');
  }
}

export async function loadSavingsAccountTransferSheetAction(
  accountId: string | number
): Promise<
  | { ok: true; template: AccountTransferTemplate }
  | Extract<AccountTransferActionResult, { ok: false }>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');
    const template = await getAccountTransferTemplate({
      fromAccountId: accountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE
    });
    return { ok: true, template };
  } catch (err) {
    return toFineractActionError(err, 'Could not load transfer form.');
  }
}

export async function createSavingsAccountTransferAction(
  clientId: string,
  fromAccountId: string | number,
  raw: unknown
): Promise<AccountTransferActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseTransferInput(raw);
  if (!parsed.ok) {
    return parsed;
  }

  const input = parsed.data;

  if (input.toAccountType !== SAVINGS_PORTFOLIO_ACCOUNT_TYPE) {
    return {
      ok: false,
      message: 'Only transfers to savings accounts are supported at this time.'
    };
  }

  if (input.toAccountId === Number(fromAccountId)) {
    return {
      ok: false,
      message: 'Cannot transfer to the same savings account.',
      fieldErrors: { toAccountId: 'Choose a different savings account.' }
    };
  }

  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');

    const template = await getAccountTransferTemplate({
      fromAccountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE
    });

    const fromClientId = template.fromClient?.id;
    const fromOfficeId = template.fromClient?.officeId ?? template.fromOffice?.id;

    if (fromClientId === undefined || fromOfficeId === undefined) {
      return { ok: false, message: 'Could not resolve the source account for this transfer.' };
    }

    const fromAccount = await getSavingsAccount(fromAccountId);
    if (!fromAccount) {
      return { ok: false, message: 'Could not load the source savings account.' };
    }
    const availableBalance = savingsAccountAvailableBalance(fromAccount);
    const templateBalance = accountTransferAvailableBalance(template);
    const maxTransferAmount = availableBalance > 0 ? availableBalance : templateBalance;

    if (input.transferAmount > maxTransferAmount) {
      return {
        ok: false,
        message: 'Transfer amount exceeds available balance.',
        fieldErrors: { transferAmount: 'Amount exceeds available balance.' }
      };
    }

    const body = buildCreateAccountTransferBody(input, {
      fromAccountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
      fromClientId,
      fromOfficeId,
      dateFormat: template.dateFormat,
      locale: template.locale
    });

    const response = await createAccountTransfer(body);
    revalidateSavingsAccountPaths(clientId, fromAccountId);
    return {
      ok: true,
      resourceId: response.resourceId ?? response.transactionId
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not complete the transfer.');
  }
}

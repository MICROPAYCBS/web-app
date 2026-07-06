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
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import {
  loanAccountRepaymentTransferCascade,
  loanAccountRepaymentTransferGeneralPath
} from '@/lib/fineract/loan-account-repayment-transfer';
import { LOAN_PORTFOLIO_ACCOUNT_TYPE } from '@/lib/fineract/portfolio-account-types';
import { resolveClientOfficeId } from '@/lib/fineract/resolve-client-office-id';
import { getClient } from '@/lib/fineract/clients';
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

function revalidateLoanRepaymentTransferPaths(
  clientId: string,
  loanAccountId: string | number,
  savingsAccountId: string | number
) {
  revalidatePath(loanAccountRepaymentTransferGeneralPath(clientId, loanAccountId));
  revalidatePath(clientAccountGeneralPath(clientId, 'savings', savingsAccountId));
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

export async function loadLoanAccountRepaymentTransferSheetAction(
  clientId: string,
  loanAccountId: string | number,
  fromSavingsAccountId: string | number
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
    const client = await getClient(clientId);
    const fromOfficeId = await resolveClientOfficeId(clientId, client);
    const template = await getAccountTransferTemplate({
      fromAccountId: fromSavingsAccountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
      cascade: loanAccountRepaymentTransferCascade(
        clientId,
        fromOfficeId,
        Number(loanAccountId)
      )
    });
    return { ok: true, template };
  } catch (err) {
    return toFineractActionError(err, 'Could not load repayment transfer form.');
  }
}

export async function createLoanRepaymentTransferAction(
  clientId: string,
  loanAccountId: string | number,
  fromSavingsAccountId: string | number,
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
  const loanId = Number(loanAccountId);
  const savingsId = Number(fromSavingsAccountId);

  if (input.toAccountType !== LOAN_PORTFOLIO_ACCOUNT_TYPE) {
    return { ok: false, message: 'Repayment transfers must post to this loan account.' };
  }

  if (input.toAccountId !== loanId) {
    return { ok: false, message: 'Repayment transfers must post to this loan account.' };
  }

  if (input.toClientId !== Number(clientId)) {
    return { ok: false, message: 'Repayment transfers must stay on this customer.' };
  }

  try {
    assertCan(session, 'CREATE_ACCOUNTTRANSFER');

    const loanAccount = await getLoanAccount(String(loanAccountId));
    if (!loanAccount) {
      return { ok: false, message: 'Could not load this loan account.' };
    }

    const linkedSavingsId = loanAccount.linkedAccount?.id ?? loanAccount.linkAccountId;
    if (linkedSavingsId == null || linkedSavingsId !== savingsId) {
      return {
        ok: false,
        message: 'Repayment transfers must use the loan’s linked savings account.'
      };
    }

    const client = await getClient(clientId);
    const fromOfficeId = await resolveClientOfficeId(clientId, client);

    const template = await getAccountTransferTemplate({
      fromAccountId: fromSavingsAccountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
      cascade: loanAccountRepaymentTransferCascade(clientId, fromOfficeId, loanId)
    });

    const fromClientId = template.fromClient?.id;
    const resolvedFromOfficeId = template.fromClient?.officeId ?? template.fromOffice?.id;

    if (fromClientId === undefined || resolvedFromOfficeId === undefined) {
      return { ok: false, message: 'Could not resolve the source account for this transfer.' };
    }

    const fromAccount = await getSavingsAccount(fromSavingsAccountId);
    if (!fromAccount) {
      return { ok: false, message: 'Could not load the linked savings account.' };
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
      fromAccountId: fromSavingsAccountId,
      fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
      fromClientId,
      fromOfficeId: resolvedFromOfficeId,
      dateFormat: template.dateFormat,
      locale: template.locale
    });

    const response = await createAccountTransfer(body);
    revalidateLoanRepaymentTransferPaths(clientId, loanAccountId, fromSavingsAccountId);
    return actionSuccessFromFineractCommand(response, {
      resourceId: response.resourceId ?? response.transactionId
    });
  } catch (err) {
    return toFineractActionError(err, 'Could not complete the repayment transfer.');
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

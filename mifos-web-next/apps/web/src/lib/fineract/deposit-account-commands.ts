import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCommandProcessingResult,
  FineractEnumOption,
  FineractSavingsAccountDetail
} from '@mifos/api-client';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';
import { createFineractClient } from '@/lib/fineract/create-client';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import {
  DEPOSIT_UNDO_ACTIVATION_API_COMMAND,
  type DepositAccountLifecycleCommand,
  type DepositAccountTransactionCommand
} from '@/lib/fineract/deposit-account-command-meta';
import { normalizeDepositAccountDetail } from '@/lib/fineract/savings-accounts';

export type {
  DepositAccountLifecycleCommand,
  DepositAccountTransactionCommand
} from '@/lib/fineract/deposit-account-command-meta';
export { DEPOSIT_UNDO_ACTIVATION_API_COMMAND } from '@/lib/fineract/deposit-account-command-meta';

export type DepositAccountClosureTemplate = {
  maturityAmount?: number;
  onAccountClosureOptions: FineractEnumOption[];
  savingsAccounts: Array<{ id: number; accountNo?: string; productName?: string }>;
};

function apiPath(kind: TermDepositAccountKind): string {
  return CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].apiPath;
}

export async function getTermDepositAccount(
  kind: TermDepositAccountKind,
  accountId: string | number
): Promise<FineractSavingsAccountDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/${apiPath(kind)}/${accountId}`, {
    associations: 'all'
  });
  return normalizeDepositAccountDetail(raw);
}

export async function executeDepositAccountLifecycleCommand(
  kind: TermDepositAccountKind,
  accountId: string | number,
  command: DepositAccountLifecycleCommand,
  body: Record<string, unknown> = {}
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  const apiCommand =
    command === 'undoActivation' ? DEPOSIT_UNDO_ACTIVATION_API_COMMAND : command;
  return fineract.post<FineractCommandProcessingResult>(
    `/${apiPath(kind)}/${accountId}`,
    body,
    { command: apiCommand }
  );
}

export async function calculateDepositAccountPrematureAmount(
  kind: TermDepositAccountKind,
  accountId: string | number,
  body: Record<string, unknown>
): Promise<DepositAccountClosureTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<unknown>(`/${apiPath(kind)}/${accountId}`, body, {
    command: 'calculatePrematureAmount'
  });
  return normalizeClosureTemplate(raw);
}

export async function getDepositAccountCloseTemplate(
  kind: TermDepositAccountKind,
  accountId: string | number
): Promise<DepositAccountClosureTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/${apiPath(kind)}/${accountId}`, {
    command: 'close'
  });
  return normalizeClosureTemplate(raw);
}

export async function deleteDepositAccount(
  kind: TermDepositAccountKind,
  accountId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/${apiPath(kind)}/${accountId}`);
}

export async function executeDepositAccountTransaction(
  kind: TermDepositAccountKind,
  accountId: string | number,
  command: DepositAccountTransactionCommand,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/${apiPath(kind)}/${accountId}/transactions`,
    body,
    { command }
  );
}

export async function getDepositAccountTransactionTemplate(
  kind: TermDepositAccountKind,
  accountId: string | number,
  command: DepositAccountTransactionCommand
): Promise<unknown> {
  const fineract = await createFineractClient();
  return fineract.get<unknown>(`/${apiPath(kind)}/${accountId}/transactions/template`, {
    command
  });
}

function normalizeClosureTemplate(raw: unknown): DepositAccountClosureTemplate {
  if (!raw || typeof raw !== 'object') {
    return { onAccountClosureOptions: [], savingsAccounts: [] };
  }
  const row = raw as Record<string, unknown>;
  const options = Array.isArray(row.onAccountClosureOptions)
    ? (row.onAccountClosureOptions as FineractEnumOption[])
    : [];
  const savingsRaw = Array.isArray(row.savingsAccounts) ? row.savingsAccounts : [];
  const savingsAccounts: DepositAccountClosureTemplate['savingsAccounts'] = [];
  for (const item of savingsRaw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const account = item as Record<string, unknown>;
    const id = typeof account.id === 'number' ? account.id : Number(account.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    savingsAccounts.push({
      id,
      accountNo: typeof account.accountNo === 'string' ? account.accountNo : undefined,
      productName: typeof account.productName === 'string' ? account.productName : undefined
    });
  }
  return {
    maturityAmount:
      typeof row.maturityAmount === 'number'
        ? row.maturityAmount
        : typeof row.maturityAmount === 'string'
          ? Number(row.maturityAmount)
          : undefined,
    onAccountClosureOptions: options,
    savingsAccounts
  };
}

import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createFineractClient } from '@/lib/fineract/create-client';

const SAVINGS_ACCOUNTS_PATH = '/savingsaccounts';

/** Fineract code id for savings account block reasons. */
export const SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID = 35;

export interface SavingsAccountPaymentTypeOption {
  id: number;
  name: string;
  isSystemDefined?: boolean;
}

export interface SavingsAccountTransactionTemplate {
  paymentTypeOptions?: SavingsAccountPaymentTypeOption[];
}

export type SavingsAccountLifecycleCommand =
  | 'approve'
  | 'activate'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoApproval'
  | 'close'
  | 'block'
  | 'unblock'
  | 'blockCredit'
  | 'unblockCredit'
  | 'blockDebit'
  | 'unblockDebit';

export type SavingsAccountTransactionCommand = 'deposit' | 'withdrawal';

export async function executeSavingsAccountCommand(
  accountId: string | number,
  command: SavingsAccountLifecycleCommand,
  body: Record<string, unknown>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${SAVINGS_ACCOUNTS_PATH}/${accountId}`, body, { command });
}

export async function executeSavingsAccountTransaction(
  accountId: string | number,
  command: SavingsAccountTransactionCommand,
  body: Record<string, unknown>
): Promise<{ resourceId?: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId?: number }>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions`,
    body,
    { command }
  );
}

export async function getSavingsAccountTransactionTemplate(
  accountId: string | number,
  command: SavingsAccountTransactionCommand
): Promise<SavingsAccountTransactionTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions/template`,
    { command }
  );
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const options = Array.isArray(row.paymentTypeOptions) ? row.paymentTypeOptions : [];
  const paymentTypeOptions: SavingsAccountPaymentTypeOption[] = [];
  for (const item of options) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const option = item as Record<string, unknown>;
    const id = Number(option.id);
    const name = typeof option.name === 'string' ? option.name : '';
    if (!Number.isFinite(id) || !name) {
      continue;
    }
    paymentTypeOptions.push({
      id,
      name,
      isSystemDefined: option.isSystemDefined === true
    });
  }
  return { paymentTypeOptions };
}

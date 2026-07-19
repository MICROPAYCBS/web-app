import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractDefineOpeningBalanceMutationResponse,
  FineractOpeningBalanceContraAccount,
  FineractOpeningBalanceGlAccount,
  FineractOpeningBalanceTemplate
} from '@mifos/api-client';
import {
  buildDefineOpeningBalancePayload,
  type DefineOpeningBalanceInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const OPENING_BALANCE_PATH = '/journalentries/openingbalance';
const JOURNAL_ENTRIES_PATH = '/journalentries';

function normalizeGlAccount(raw: unknown): FineractOpeningBalanceGlAccount | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const glAccountId = Number(row.glAccountId);
  if (!Number.isFinite(glAccountId)) {
    return null;
  }
  const glAccountType =
    row.glAccountType && typeof row.glAccountType === 'object'
      ? (row.glAccountType as { value?: string })
      : { value: '' };

  return {
    glAccountId,
    glAccountCode: typeof row.glAccountCode === 'string' ? row.glAccountCode : '',
    glAccountName: typeof row.glAccountName === 'string' ? row.glAccountName : '',
    glAccountType: { value: glAccountType.value ?? '' }
  };
}

function normalizeContraAccount(raw: unknown): FineractOpeningBalanceContraAccount | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  return {
    id: Number.isFinite(id) ? id : undefined,
    glCode: typeof row.glCode === 'string' ? row.glCode : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
    nameDecorated: typeof row.nameDecorated === 'string' ? row.nameDecorated : undefined
  };
}

function collectGlAccounts(raw: Record<string, unknown>): FineractOpeningBalanceGlAccount[] {
  const keys = [
    'assetAccountOpeningBalances',
    'liabityAccountOpeningBalances',
    'equityAccountOpeningBalances',
    'incomeAccountOpeningBalances',
    'expenseAccountOpeningBalances'
  ] as const;

  const accounts: FineractOpeningBalanceGlAccount[] = [];
  for (const key of keys) {
    const value = raw[key];
    if (!Array.isArray(value)) {
      continue;
    }
    for (const item of value) {
      const account = normalizeGlAccount(item);
      if (account) {
        accounts.push(account);
      }
    }
  }
  return accounts;
}

function normalizeOpeningBalanceTemplate(raw: unknown): FineractOpeningBalanceTemplate {
  if (!raw || typeof raw !== 'object') {
    return { glAccounts: [] };
  }
  const row = raw as Record<string, unknown>;
  const glAccounts = Array.isArray(row.glAccounts)
    ? row.glAccounts
        .map((item) => normalizeGlAccount(item))
        .filter((item): item is FineractOpeningBalanceGlAccount => item != null)
    : collectGlAccounts(row);

  return {
    contraAccount: normalizeContraAccount(row.contraAccount),
    glAccounts
  };
}

export async function getOpeningBalanceTemplate(
  officeId: number
): Promise<FineractOpeningBalanceTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(OPENING_BALANCE_PATH, {
    officeId: String(officeId)
  });
  return normalizeOpeningBalanceTemplate(raw);
}

export async function defineOpeningBalance(
  input: DefineOpeningBalanceInput
): Promise<FineractDefineOpeningBalanceMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractDefineOpeningBalanceMutationResponse>(
    JOURNAL_ENTRIES_PATH,
    buildDefineOpeningBalancePayload(input),
    { command: 'defineOpeningBalance' }
  );
}

import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientSavingsAccount,
  FineractStaffOption
} from '@mifos/api-client';
import {
  filterOpenSavingsAccounts,
  filterSavingsByDepositType,
  getClientAccounts
} from '@/lib/fineract/client-accounts';
import { createFineractClient } from '@/lib/fineract/create-client';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { fromFineractDateArray } from '@/lib/fineract/dates';

export interface CodeValueOption {
  id: number;
  name: string;
}

export interface ClientCommandTemplateData {
  narrations: CodeValueOption[];
}

export interface ClientWithTemplateData {
  staffOptions: FineractStaffOption[];
  savingAccountOptions: CodeValueOption[];
  savingsAccountId?: number;
  savingsProductName?: string;
}

/** Fineract client template returns accountNo, not name (legacy web-app). */
type FineractSavingAccountOption = {
  id: number;
  name?: string;
  accountNo?: string;
  productName?: string;
};

type ClientTemplateResponse = {
  staffOptions?: FineractStaffOption[];
  savingAccountOptions?: FineractSavingAccountOption[];
  savingsAccountId?: number;
};

type CommandTemplateResponse = {
  narrations?: CodeValueOption[];
};

function normalizeOptions(items: CodeValueOption[] | undefined): CodeValueOption[] {
  return (items ?? []).filter(
    (item) => typeof item.id === 'number' && item.name?.trim()
  );
}

function formatSavingAccountLabel(item: FineractSavingAccountOption): string {
  const accountNo = item.accountNo?.trim();
  const name = item.name?.trim();
  const productName = item.productName?.trim();
  if (accountNo && productName) {
    return `${productName} (${accountNo})`;
  }
  if (accountNo) {
    return accountNo;
  }
  if (name) {
    return name;
  }
  if (productName) {
    return productName;
  }
  return `Account ${item.id}`;
}

function normalizeSavingAccountOptions(
  items: FineractSavingAccountOption[] | undefined
): CodeValueOption[] {
  return (items ?? [])
    .filter((item) => typeof item.id === 'number')
    .map((item) => ({
      id: item.id,
      name: formatSavingAccountLabel(item)
    }));
}

function savingsAccountsEligibleForDefault(
  accounts: FineractClientSavingsAccount[]
): FineractClientSavingsAccount[] {
  const open = filterOpenSavingsAccounts(accounts);
  const plainSavings = filterSavingsByDepositType(open, 'Savings');
  if (plainSavings.length > 0) {
    return plainSavings;
  }
  return open.filter((account) => {
    const depositType = account.depositType?.value;
    return depositType !== 'Fixed Deposit' && depositType !== 'Recurring Deposit';
  });
}

async function savingAccountOptionsFromAccounts(
  clientId: string | number
): Promise<CodeValueOption[]> {
  const accounts = await getClientAccounts(clientId);
  const savings = savingsAccountsEligibleForDefault(accounts.savingsAccounts ?? []);
  return savings.map((account) => ({
    id: account.id,
    name: formatSavingAccountLabel(account)
  }));
}

export async function getClientCommandTemplate(
  command: 'close' | 'reject' | 'withdraw'
): Promise<ClientCommandTemplateData> {
  const fineract = await createFineractClient();
  const data = await fineract.get<CommandTemplateResponse>('/clients/template', {
    commandParam: command
  });
  return { narrations: normalizeOptions(data.narrations) };
}

export async function getClientWithTemplate(
  clientId: string | number
): Promise<ClientWithTemplateData> {
  const fineract = await createFineractClient();
  const data = await fineract.get<ClientTemplateResponse>(`/clients/${clientId}`, {
    template: 'true',
    staffInSelectedOfficeOnly: 'true'
  });
  let savingAccountOptions = normalizeSavingAccountOptions(data.savingAccountOptions);
  if (savingAccountOptions.length === 0) {
    savingAccountOptions = await savingAccountOptionsFromAccounts(clientId);
  }

  const savingsProductName =
    data.savingsAccountId != null
      ? savingAccountOptions.find((option) => option.id === data.savingsAccountId)?.name
      : undefined;

  return {
    staffOptions: data.staffOptions ?? [],
    savingAccountOptions,
    savingsAccountId: data.savingsAccountId,
    savingsProductName
  };
}

export { listOfficeOptions };

/** Fineract returns proposal date as array or string depending on version. */
export async function getClientTransferProposalDate(
  clientId: string | number
): Promise<Date | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<number[] | string | { proposalDate?: number[] }>(
    `/clients/${clientId}/transferproposaldate`
  );
  if (Array.isArray(raw)) {
    return fromFineractDateArray(raw);
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw.proposalDate)) {
    return fromFineractDateArray(raw.proposalDate);
  }
  return null;
}

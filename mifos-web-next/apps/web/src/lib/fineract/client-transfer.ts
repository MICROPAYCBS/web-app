import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAccounts,
  FineractClientLoanAccount,
  FineractClientSavingsAccount,
  FineractSavingsOnHoldTransaction,
  FineractSavingsOnHoldTransactionsPage, FineractCommandProcessingResult } from '@mifos/api-client';
import {
  accountTransferInProgress,
  accountTransferOnHold,
  accountUnderTransfer
} from '@/lib/fineract/account-transfer-status';
import { getClientAccounts } from '@/lib/fineract/client-accounts';
import { getClientTransferProposalDate } from '@/lib/fineract/client-action-data';
import {
  clientAccountGeneralPath,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import { getClient } from '@/lib/fineract/clients';
import { clientStatusKind, type ClientStatusKind } from '@/lib/fineract/client-status';
import { createFineractClient } from '@/lib/fineract/create-client';
import { formatFineractDateArray, fromFineractDateArray } from '@/lib/fineract/dates';

export type ClientTransferAccountRow = {
  id: number;
  accountNo: string;
  productName?: string;
  productKind: ClientAccountProductKind;
  statusLabel?: string;
  transferState: 'in_progress' | 'on_hold';
  href: string;
};

export type ClientTransferOnHoldRow = {
  savingsId: number;
  savingsAccountNo: string;
  transactionId: number;
  amountLabel: string;
  dateLabel: string;
  reason?: string;
};

export type ClientTransferContext = {
  clientStatus: ClientStatusKind;
  currentOfficeName?: string;
  destinationOfficeName?: string;
  transferDateLabel: string | null;
  accounts: ClientTransferAccountRow[];
  onHoldTransactions: ClientTransferOnHoldRow[];
};

function savingsKind(account: FineractClientSavingsAccount): ClientAccountProductKind {
  const depositType = account.depositType?.value;
  if (depositType === 'Fixed Deposit') {
    return 'fixedDeposit';
  }
  if (depositType === 'Recurring Deposit') {
    return 'recurringDeposit';
  }
  return 'savings';
}

function collectTransferAccounts(
  clientId: string | number,
  accounts: FineractClientAccounts
): ClientTransferAccountRow[] {
  const rows: ClientTransferAccountRow[] = [];

  const pushSavings = (list: FineractClientSavingsAccount[] | undefined) => {
    for (const account of list ?? []) {
      const onHold = accountTransferOnHold(account.status);
      const inProgress = accountTransferInProgress(account.status);
      if (!onHold && !inProgress) {
        continue;
      }
      const kind = savingsKind(account);
      rows.push({
        id: account.id,
        accountNo: account.accountNo,
        productName: account.productName,
        productKind: kind,
        statusLabel: account.status?.value,
        transferState: onHold ? 'on_hold' : 'in_progress',
        href: clientAccountGeneralPath(clientId, kind, account.id)
      });
    }
  };

  for (const loan of accounts.loanAccounts ?? []) {
    if (!accountUnderTransfer(loan.status)) {
      continue;
    }
    rows.push(mapLoan(clientId, loan));
  }
  for (const loan of accounts.workingCapitalLoanAccounts ?? []) {
    if (!accountUnderTransfer(loan.status)) {
      continue;
    }
    rows.push(mapLoan(clientId, loan));
  }

  pushSavings(accounts.savingsAccounts);

  return rows.sort((a, b) => a.accountNo.localeCompare(b.accountNo));
}

function mapLoan(
  clientId: string | number,
  loan: FineractClientLoanAccount
): ClientTransferAccountRow {
  const onHold = accountTransferOnHold(loan.status);
  return {
    id: loan.id,
    accountNo: loan.accountNo,
    productName: loan.productName,
    productKind: 'loan',
    statusLabel: loan.status?.value,
    transferState: onHold ? 'on_hold' : 'in_progress',
    href: clientAccountGeneralPath(clientId, 'loan', loan.id)
  };
}

function formatOnHoldDate(raw: number[] | string | undefined): string {
  if (Array.isArray(raw)) {
    return formatFineractDateArray(raw) ?? '—';
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? raw
      : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsed);
  }
  return '—';
}

function formatOnHoldAmount(
  amount: number | undefined,
  currency?: { code?: string; displaySymbol?: string }
): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  const symbol = currency?.displaySymbol ?? currency?.code ?? '';
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return symbol ? `${symbol} ${formatted}` : formatted;
}

export async function listSavingsOnHoldTransactions(
  savingsId: string | number
): Promise<FineractSavingsOnHoldTransaction[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<
    FineractSavingsOnHoldTransaction[] | FineractSavingsOnHoldTransactionsPage
  >(`/savingsaccounts/${savingsId}/onholdtransactions`, { limit: '200' });
  if (Array.isArray(data)) {
    return data;
  }
  return data.pageItems ?? [];
}

export async function releaseSavingsOnHoldAmount(
  savingsId: string | number,
  transactionId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/savingsaccounts/${savingsId}/transactions/${transactionId}`,
    {},
    { command: 'releaseAmount' }
  );
}

async function collectOnHoldRows(
  clientId: string | number,
  accounts: FineractClientAccounts
): Promise<ClientTransferOnHoldRow[]> {
  const savingsById = new Map<number, string>();
  for (const account of accounts.savingsAccounts ?? []) {
    savingsById.set(account.id, account.accountNo);
  }

  const savingsIds = [...savingsById.keys()];
  const rows: ClientTransferOnHoldRow[] = [];

  await Promise.all(
    savingsIds.map(async (savingsId) => {
      const items = await listSavingsOnHoldTransactions(savingsId).catch(() => []);
      for (const item of items) {
        if (typeof item.id !== 'number') {
          continue;
        }
        rows.push({
          savingsId,
          savingsAccountNo: savingsById.get(savingsId) ?? String(savingsId),
          transactionId: item.id,
          amountLabel: formatOnHoldAmount(item.amount, item.currency),
          dateLabel: formatOnHoldDate(item.transactionDate),
          reason: item.reasonForBlock?.trim() || undefined
        });
      }
    })
  );

  return rows.sort((a, b) =>
    a.savingsAccountNo.localeCompare(b.savingsAccountNo)
  );
}

export async function getClientTransferContext(
  clientId: string | number
): Promise<ClientTransferContext | null> {
  const client = await getClient(clientId);
  const clientStatus = clientStatusKind(client);
  if (clientStatus !== 'transferInProgress' && clientStatus !== 'transferOnHold') {
    return null;
  }

  const [proposalDate, accounts] = await Promise.all([
    getClientTransferProposalDate(clientId).catch(() => null),
    getClientAccounts(clientId).catch(() => null)
  ]);

  if (!accounts) {
    return null;
  }

  const proposedFromClient = client.proposedTransferDate
    ? fromFineractDateArray(client.proposedTransferDate)
    : null;
  const transferDate = proposalDate ?? proposedFromClient;
  const transferDateLabel = transferDate
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(transferDate)
    : null;

  const destinationOfficeName =
    client.transferToOffice?.nameDecorated?.trim() ||
    client.transferToOffice?.name?.trim() ||
    undefined;

  const onHoldTransactions =
    clientStatus === 'transferOnHold'
      ? await collectOnHoldRows(clientId, accounts)
      : [];

  return {
    clientStatus,
    currentOfficeName: client.officeName,
    destinationOfficeName,
    transferDateLabel,
    accounts: collectTransferAccounts(clientId, accounts),
    onHoldTransactions
  };
}

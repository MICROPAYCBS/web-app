/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CollectionSheetClient,
  CollectionSheetData,
  CollectionSheetLoanDue,
  CollectionSheetSavingsDue
} from '@/lib/fineract/collection-sheet-sum';

export type CollectionSheetRow = {
  clientId: number;
  clientName: string;
  loanAmountDue: number;
  savingsDue: number;
  totalAmountDue: number;
  dueDate?: string | number[];
  loans?: CollectionSheetLoanDue[];
  savings?: CollectionSheetSavingsDue[];
};

function flattenCollectionClients(
  data: CollectionSheetData | CollectionSheetClient | undefined
): CollectionSheetClient[] {
  if (!data) {
    return [];
  }

  if ('clientId' in data && data.clientId != null) {
    return [data];
  }

  const clients: CollectionSheetClient[] = [];
  if ('clients' in data && Array.isArray(data.clients)) {
    for (const client of data.clients) {
      clients.push(...flattenCollectionClients(client));
    }
  }
  if ('groups' in data && Array.isArray(data.groups)) {
    for (const group of data.groups) {
      clients.push(...flattenCollectionClients(group));
    }
  }
  return clients;
}

function sumLoanAmountDue(loans: CollectionSheetLoanDue[] | undefined): number {
  return (loans ?? []).reduce(
    (sum, loan) =>
      sum +
      (loan.principalDue ?? 0) +
      (loan.interestDue ?? 0) +
      (loan.feeDue ?? 0) +
      (loan.penaltyDue ?? 0),
    0
  );
}

function sumSavingsDue(savings: CollectionSheetSavingsDue[] | undefined): number {
  return (savings ?? []).reduce(
    (sum, item) => sum + (item.dueAmount ?? item.totalDue ?? 0),
    0
  );
}

export function transformCollectionSheetRows(data: CollectionSheetData): CollectionSheetRow[] {
  return flattenCollectionClients(data)
    .map((client) => {
      const loanAmountDue = sumLoanAmountDue(client.loans);
      const savingsDue = sumSavingsDue(client.savings);
      return {
        clientId: client.clientId ?? 0,
        clientName: client.clientName?.trim() || `Customer #${client.clientId ?? '—'}`,
        loanAmountDue,
        savingsDue,
        totalAmountDue: loanAmountDue + savingsDue,
        dueDate: data.dueDate,
        loans: client.loans,
        savings: client.savings
      };
    })
    .filter((row) => row.clientId > 0 && (row.loanAmountDue > 0 || row.savingsDue > 0))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
}

export function sumCollectionSheetRowTotals(rows: CollectionSheetRow[]): {
  clientCount: number;
  totalDue: number;
} {
  let totalDue = 0;
  for (const row of rows) {
    totalDue += row.totalAmountDue;
  }
  return { clientCount: rows.length, totalDue };
}

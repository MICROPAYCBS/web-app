/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CollectionSheetLoanDue = {
  loanId?: number;
  currency?: { code?: string };
  currencyCode?: string;
  principalDue?: number;
  interestDue?: number;
  feeDue?: number;
  penaltyDue?: number;
};

export type CollectionSheetSavingsDue = {
  currency?: { code?: string };
  currencyCode?: string;
  dueAmount?: number;
  totalDue?: number;
};

export type CollectionSheetClient = {
  clientId?: number;
  clientName?: string;
  loans?: CollectionSheetLoanDue[];
  savings?: CollectionSheetSavingsDue[];
};

export type CollectionSheetData = {
  dueDate?: string | number[];
  clients?: CollectionSheetClient[];
  groups?: CollectionSheetData[];
};

function flattenCollectionClients(data: CollectionSheetData | CollectionSheetClient | undefined): CollectionSheetClient[] {
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

function readCollectionSheetCurrencyCode(
  row: { currency?: { code?: string }; currencyCode?: string } | undefined
): string | undefined {
  const code = row?.currencyCode ?? row?.currency?.code;
  return code?.trim().toUpperCase() || undefined;
}

function matchesCollectionSheetCurrency(
  rowCurrencyCode: string | undefined,
  filterCurrencyCode: string | null | undefined
): boolean {
  if (!filterCurrencyCode?.trim()) {
    return true;
  }
  if (!rowCurrencyCode) {
    return true;
  }
  return rowCurrencyCode === filterCurrencyCode.trim().toUpperCase();
}

export function sumCollectionSheetExpected(
  data: CollectionSheetData,
  currencyCode?: string | null
): {
  totalExpected: number;
  loanCount: number;
} {
  let totalExpected = 0;
  let loanCount = 0;

  for (const client of flattenCollectionClients(data)) {
    for (const loan of client.loans ?? []) {
      const loanCurrencyCode = readCollectionSheetCurrencyCode(loan);
      if (!matchesCollectionSheetCurrency(loanCurrencyCode, currencyCode)) {
        continue;
      }
      const loanTotal =
        (loan.principalDue ?? 0) +
        (loan.interestDue ?? 0) +
        (loan.feeDue ?? 0) +
        (loan.penaltyDue ?? 0);
      if (loanTotal > 0) {
        totalExpected += loanTotal;
        loanCount += 1;
      }
    }
    for (const savings of client.savings ?? []) {
      const savingsCurrencyCode = readCollectionSheetCurrencyCode(savings);
      if (!matchesCollectionSheetCurrency(savingsCurrencyCode, currencyCode)) {
        continue;
      }
      const amount = savings.dueAmount ?? savings.totalDue ?? 0;
      if (amount > 0) {
        totalExpected += amount;
      }
    }
  }

  return { totalExpected, loanCount };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractProvisioningEntryListItem {
  id: number;
  createdUser: string;
  createdDate: string;
  journalEntry: boolean;
}

export interface FineractProvisioningEntriesPage {
  pageItems: FineractProvisioningEntryListItem[];
  totalFilteredRecords: number;
}

export interface FineractProvisioningEntryDetail {
  id: number;
  createdUser: string;
  createdDate: string;
  reservedAmount: string | number;
  journalEntry: boolean;
}

export interface FineractProvisioningEntryLineItem {
  officeName: string;
  productName: string;
  currencyCode: string;
  categoryName: string;
  amountreserved: string | number;
  liabilityAccountName: string;
  expenseAccountName: string;
}

export interface FineractProvisioningEntryLinesPage {
  pageItems: FineractProvisioningEntryLineItem[];
  totalFilteredRecords: number;
}

export interface FineractProvisioningCategory {
  id: number;
  categoryName: string;
}

export interface FineractProvisioningJournalEntry {
  id: number;
  officeName: string;
  transactionDate: string | number[];
  transactionId: string;
  glAccountType: { value: string };
  createdByUserName: string;
  glAccountCode: string;
  glAccountName: string;
  entryType: { value: string };
  amount: number;
  currency: { code: string; displaySymbol?: string };
}

export interface FineractProvisioningJournalEntriesPage {
  pageItems: FineractProvisioningJournalEntry[];
  totalFilteredRecords: number;
}

export interface FineractProvisioningEntryMutationResponse {
  resourceId: number;
}

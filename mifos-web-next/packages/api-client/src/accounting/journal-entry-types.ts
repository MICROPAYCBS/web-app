/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface FineractJournalEntryCurrency {
  code: string;
  displaySymbol?: string;
  name?: string;
}

export interface FineractJournalEntryListItem {
  id: number;
  officeName: string;
  transactionId: string;
  transactionDate: string | number[];
  glAccountType: FineractEnumOption;
  createdByUserName?: string;
  submittedOnDate?: string | number[];
  glAccountCode: string;
  glAccountName: string;
  currency: FineractJournalEntryCurrency;
  entryType: FineractEnumOption;
  amount: number;
  manualEntry?: boolean;
  reversed?: boolean;
  referenceNumber?: string;
  comments?: string;
  paymentTypeName?: string;
  externalAssetOwner?: string;
  departmentId?: number;
  departmentName?: string;
  organizationRunningBalance?: number;
  officeRunningBalance?: number;
  runningBalanceComputed?: boolean;
}

export interface FineractJournalEntriesPage {
  pageItems: FineractJournalEntryListItem[];
  totalFilteredRecords: number;
}

export interface FineractJournalEntryMutationResponse {
  transactionId: string;
  officeId?: number;
  resourceId?: number;
}

export interface FineractJournalEntryRevertResponse {
  transactionId: string;
  resourceId?: number;
}

export interface FineractJournalEntryGlAccountOption {
  id: number;
  name: string;
  glCode: string;
  typeId?: number;
}

export interface FineractPaymentTypeOption {
  id: number;
  name: string;
}

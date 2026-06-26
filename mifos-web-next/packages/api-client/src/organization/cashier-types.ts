/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface OrganizationCashier {
  id: number;
  staffId?: number;
  staffName?: string;
  tellerId?: number;
  tellerName?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  isFullDay?: boolean;
  description?: string;
}

export interface OrganizationCashierListItem extends OrganizationCashier {}

export interface OrganizationCashierMutationResponse {
  resourceId?: number;
}

export interface OrganizationCashierTxnType {
  id?: number;
  code?: string;
  value?: string;
}

export interface OrganizationCashierTxnCurrency {
  code?: string;
  name?: string;
  decimalPlaces?: number;
  displaySymbol?: string;
}

export interface OrganizationCashierTransaction {
  id: number;
  cashierId?: number;
  txnDate?: number[] | string;
  txnAmount?: number;
  txnType?: OrganizationCashierTxnType;
  entityId?: number;
  entityType?: string;
  txnNote?: string;
  currency?: OrganizationCashierTxnCurrency;
}

export interface OrganizationCashierSummary {
  netCash?: number;
  sumCashAllocation?: number;
  sumCashSettlement?: number;
  sumInwardCash?: number;
  sumOutwardCash?: number;
  cashierName?: string;
  tellerName?: string;
  officeName?: string;
  cashierTransactions?: {
    pageItems?: OrganizationCashierTransaction[];
  };
}

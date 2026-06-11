/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface InvestorTransferOwner {
  externalId?: string;
}

export interface InvestorTransferDetails {
  totalPrincipalOutstanding?: number;
  totalInterestOutstanding?: number;
  totalFeeChargesOutstanding?: number;
  totalPenaltyChargesOutstanding?: number;
  totalOutstanding?: number;
  totalOverpaid?: number;
}

export interface InvestorTransferItem {
  transferId?: number;
  transferExternalId?: string;
  status?: string;
  effectiveFrom?: string | number[];
  effectiveTo?: string | number[];
  settlementDate?: string | number[];
  owner?: InvestorTransferOwner;
  loanAccount?: string;
  purchasePriceRatio?: number;
  totalAmount?: number;
  details?: InvestorTransferDetails;
}

export interface InvestorTransferSearchPage {
  content: InvestorTransferItem[];
  totalElements: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { LoanProductCharge, ProductGlAccountRef } from './loan-product-types';

export interface ShareProductMarketPricePeriod {
  fromDate?: string;
  shareValue?: number;
}

export interface ShareProductListItem {
  id: number;
  name?: string;
  shortName?: string;
  totalShares?: number;
  currencyCode?: string;
  accountingRule?: FineractEnumOption;
}

export type ShareProductSectionId = 'general' | 'terms' | 'marketPrice' | 'fees' | 'accounting';

export interface ShareProductDetail extends ShareProductListItem {
  description?: string;
  currency?: FineractCurrencyOption;
  totalSharesIssued?: number;
  unitPrice?: number;
  shareCapital?: number;
  minimumShares?: number;
  nominalShares?: number;
  maximumShares?: number;
  minimumActivePeriod?: number;
  minimumActivePeriodForDividendsTypeEnum?: FineractEnumOption;
  lockinPeriod?: number;
  lockPeriodTypeEnum?: FineractEnumOption;
  allowDividendCalculationForInactiveClients?: boolean;
  marketPrice?: ShareProductMarketPricePeriod[];
  accountingRule?: FineractEnumOption;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  charges?: LoanProductCharge[];
}

export interface ShareProductMutationResponse {
  resourceId: number;
}

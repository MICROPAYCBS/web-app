/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { ProductGlAccountRef } from './loan-product-types';
import type { LoanProductGlAccountOption } from './loan-product-template-types';
import type { ShareProductMarketPricePeriod } from './share-product-types';

export interface ShareProductAccountingMappingOptions {
  assetAccountOptions?: LoanProductGlAccountOption[];
  incomeAccountOptions?: LoanProductGlAccountOption[];
  equityAccountOptions?: LoanProductGlAccountOption[];
  liabilityAccountOptions?: LoanProductGlAccountOption[];
}

export interface ShareProductTemplate {
  id?: number;
  name?: string;
  shortName?: string;
  description?: string;
  currency?: FineractCurrencyOption;
  currencyOptions?: FineractCurrencyOption[];
  currencyCode?: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  totalShares?: number;
  totalSharesIssued?: number;
  unitPrice?: number;
  shareCapital?: number;
  minimumShares?: number;
  nominalShares?: number;
  maximumShares?: number;
  minimumActivePeriod?: number;
  minimumActivePeriodForDividendsTypeEnum?: FineractEnumOption;
  minimumActivePeriodFrequencyTypeOptions?: FineractEnumOption[];
  lockinPeriod?: number;
  lockPeriodTypeEnum?: FineractEnumOption;
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  allowDividendCalculationForInactiveClients?: boolean;
  marketPrice?: ShareProductMarketPricePeriod[];
  chargeOptions?: FineractEnumOption[];
  charges?: { id: number; name?: string }[];
  accountingRule?: FineractEnumOption;
  accountingRuleOptions?: FineractEnumOption[];
  accountingMappingOptions?: ShareProductAccountingMappingOptions;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  [key: string]: unknown;
}

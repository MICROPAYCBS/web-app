/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { LoanProductGlAccountOption } from './loan-product-template-types';
import type { ProductGlAccountRef } from './loan-product-types';

export interface ChargeTier {
  id?: number;
  amountRangeFrom?: number;
  /** Exclusive upper bound; null/omitted = open-ended. */
  amountRangeTo?: number | null;
  amount?: number;
}

export interface ChargeListItem {
  id: number;
  name?: string;
  active?: boolean;
  penalty?: boolean;
  amount?: number;
  currency?: FineractCurrencyOption;
  currencyCode?: string;
  chargeAppliesTo?: FineractEnumOption;
  chargeTimeType?: FineractEnumOption;
  chargeCalculationType?: FineractEnumOption;
  chargePaymentMode?: FineractEnumOption;
  useChargeTiers?: boolean;
}

export interface ChargeDetail extends ChargeListItem {
  minCap?: number;
  maxCap?: number;
  feeInterval?: number;
  feeFrequency?: FineractEnumOption;
  feeOnMonthDay?: string | number[];
  incomeOrLiabilityAccount?: ProductGlAccountRef;
  taxGroup?: { id?: number; name?: string };
  useChargeTiers?: boolean;
  chargeTiers?: ChargeTier[];
}

export interface ChargeIncomeAccountOptions {
  incomeAccountOptions?: LoanProductGlAccountOption[];
  liabilityAccountOptions?: LoanProductGlAccountOption[];
}

export interface ChargeTemplate {
  id?: number;
  name?: string;
  active?: boolean;
  penalty?: boolean;
  amount?: number;
  currency?: FineractCurrencyOption;
  currencyCode?: string;
  minCap?: number;
  maxCap?: number;
  feeInterval?: number;
  feeFrequency?: FineractEnumOption;
  feeOnMonthDay?: string | number[];
  chargeAppliesTo?: FineractEnumOption;
  chargeTimeType?: FineractEnumOption;
  chargeCalculationType?: FineractEnumOption;
  chargePaymentMode?: FineractEnumOption;
  incomeOrLiabilityAccount?: ProductGlAccountRef;
  taxGroup?: { id?: number; name?: string };
  useChargeTiers?: boolean;
  chargeTiers?: ChargeTier[];
  chargeAppliesToOptions?: FineractEnumOption[];
  currencyOptions?: FineractCurrencyOption[];
  loanChargeCalculationTypeOptions?: FineractEnumOption[];
  savingsChargeCalculationTypeOptions?: FineractEnumOption[];
  clientChargeCalculationTypeOptions?: FineractEnumOption[];
  shareChargeCalculationTypeOptions?: FineractEnumOption[];
  loanChargeTimeTypeOptions?: FineractEnumOption[];
  savingsChargeTimeTypeOptions?: FineractEnumOption[];
  clientChargeTimeTypeOptions?: FineractEnumOption[];
  shareChargeTimeTypeOptions?: FineractEnumOption[];
  chargePaymentModeOptions?: FineractEnumOption[];
  feeFrequencyOptions?: FineractEnumOption[];
  taxGroupOptions?: { id: number; name?: string }[];
  incomeOrLiabilityAccountOptions?: ChargeIncomeAccountOptions;
}

export interface ChargeMutationResponse {
  resourceId?: number;
}

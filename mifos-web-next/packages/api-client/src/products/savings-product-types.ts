/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type {
  ChargeIncomeAccountMapping,
  LoanProductCharge,
  PaymentChannelFundSourceMapping,
  ProductGlAccountRef
} from './loan-product-types';

export interface SavingsProductListItem {
  id: number;
  name?: string;
  shortName?: string;
  closeDate?: string;
  status?: string;
  currencyCode?: string;
  accountingRule?: FineractEnumOption;
}

export interface SavingsProductDetail extends SavingsProductListItem {
  description?: string;
  startDate?: string;
  currency?: FineractCurrencyOption;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestPostingPeriodType?: FineractEnumOption;
  interestCalculationType?: FineractEnumOption;
  interestCalculationDaysInYearType?: FineractEnumOption;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: FineractEnumOption;
  withdrawalFeeForTransfers?: boolean;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  minBalanceForInterestCalculation?: number;
  accountingRule?: FineractEnumOption;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  charges?: LoanProductCharge[];
  /** Empty or omitted means every payment type is allowed (legacy). */
  paymentChannels?: SavingsProductPaymentChannel[];
  feeToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
  penaltyToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
  paymentChannelToFundSourceMappings?: PaymentChannelFundSourceMapping[];
}

export interface SavingsProductPaymentChannelCharge {
  /** Charge definition id (`chargeId` / `charge.id`). Not the catalog link-row id. */
  id: number;
  name?: string;
  /** Amount stored on the channel link, including an optional override. */
  amount?: number;
  /** Amount on the charge definition, when the response includes `charge`. */
  definitionAmount?: number;
  useChargeTiers?: boolean;
}

export interface SavingsProductPaymentChannel {
  paymentTypeId: number;
  paymentTypeName?: string;
  isPremium: boolean;
  isActive: boolean;
  charges: SavingsProductPaymentChannelCharge[];
}

export type SavingsProductSectionId =
  | 'general'
  | 'terms'
  | 'fees'
  | 'paymentChannels'
  | 'accounting'
  | 'channelMapping'
  | 'feeGlMappings'
  | 'penaltyGlMappings';

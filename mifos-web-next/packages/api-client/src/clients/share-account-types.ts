/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from './types';

/** Status flags from ShareAccountStatusEnumData. */
export interface FineractShareAccountStatus {
  id?: number;
  code?: string;
  value?: string;
  submittedAndPendingApproval?: boolean;
  approved?: boolean;
  rejected?: boolean;
  active?: boolean;
  closed?: boolean;
}

export interface FineractShareAccountTimeline {
  submittedOnDate?: number[] | string;
  submittedByUsername?: string;
  submittedByFirstname?: string;
  submittedByLastname?: string;
  rejectedDate?: number[] | string;
  rejectedByUsername?: string;
  rejectedByFirstname?: string;
  rejectedByLastname?: string;
  approvedDate?: number[] | string;
  approvedByUsername?: string;
  approvedByFirstname?: string;
  approvedByLastname?: string;
  activatedDate?: number[] | string;
  activatedByUsername?: string;
  activatedByFirstname?: string;
  activatedByLastname?: string;
  closedDate?: number[] | string;
  closedByUsername?: string;
  closedByFirstname?: string;
  closedByLastname?: string;
}

export interface FineractShareAccountSummary {
  id?: number;
  accountNo?: string;
  totalApprovedShares?: number;
  totalPendingForApprovalShares?: number;
  externalId?: string;
  productId?: number;
  productName?: string;
  shortProductName?: string;
  status?: FineractShareAccountStatus;
  currency?: FineractCurrencyOption;
  timeline?: FineractShareAccountTimeline;
}

export interface FineractShareAccountTransaction {
  id: number;
  accountId?: number;
  purchasedDate?: number[] | string;
  numberOfShares?: number;
  purchasedPrice?: number;
  status?: FineractEnumOption;
  type?: FineractEnumOption;
  amount?: number;
  chargeAmount?: number;
  amountPaid?: number;
}

export interface FineractShareAccountCharge {
  id: number;
  chargeId?: number;
  accountId?: number;
  name: string;
  chargeTimeType?: FineractEnumOption;
  chargeCalculationType?: FineractEnumOption;
  percentage?: number;
  amountPercentageAppliedTo?: number;
  currency?: FineractCurrencyOption;
  amount?: number;
  amountPaid?: number;
  amountWaived?: number;
  amountWrittenOff?: number;
  amountOutstanding?: number;
  amountOrPercentage?: number;
  isActive?: boolean;
}

export interface FineractShareAccountDividend {
  id: number;
  postedDate?: number[] | string;
  amount?: number;
  status?: FineractEnumOption;
  savingsTransactionId?: number;
}

export interface FineractShareAccountProductOption {
  id: number;
  name: string;
  shortName?: string;
  totalShares?: number;
}

export interface FineractShareAccountSavingsOption {
  id: number;
  accountNo?: string;
  clientId?: number;
  clientName?: string;
  productId?: number;
  productName?: string;
  status?: FineractShareAccountStatus;
  currency?: FineractCurrencyOption;
}

export interface FineractShareAccountChargeOption {
  id: number;
  name?: string;
  amount?: number;
  amountOrPercentage?: number;
  penalty?: boolean;
  currency?: FineractCurrencyOption;
  chargeTimeType?: FineractEnumOption;
  chargeCalculationType?: FineractEnumOption;
}

export interface FineractShareAccountTemplate {
  clientId?: number;
  clientName?: string;
  productId?: number;
  productName?: string;
  currency?: FineractCurrencyOption;
  currentMarketPrice?: number;
  defaultShares?: number;
  productOptions?: FineractShareAccountProductOption[];
  chargeOptions?: FineractShareAccountChargeOption[];
  charges?: FineractShareAccountChargeOption[];
  clientSavingsAccounts?: FineractShareAccountSavingsOption[];
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  minimumActivePeriodFrequencyTypeOptions?: FineractEnumOption[];
  lockinPeriod?: number;
  lockPeriodTypeEnum?: FineractEnumOption;
  minimumActivePeriod?: number;
  minimumActivePeriodTypeEnum?: FineractEnumOption;
  allowDividendCalculationForInactiveClients?: boolean;
}

export interface FineractShareAccountDetail {
  id: number;
  accountNo: string;
  externalId?: string;
  savingsAccountNumber?: string;
  clientId?: number;
  clientName?: string;
  defaultShares?: number;
  productId?: number;
  productName?: string;
  status: FineractShareAccountStatus;
  timeline?: FineractShareAccountTimeline;
  currency: FineractCurrencyOption;
  summary?: FineractShareAccountSummary;
  purchasedShares?: FineractShareAccountTransaction[];
  savingsAccountId?: number;
  currentMarketPrice?: number;
  lockinPeriod?: number;
  lockPeriodTypeEnum?: FineractEnumOption;
  minimumActivePeriod?: number;
  minimumActivePeriodTypeEnum?: FineractEnumOption;
  allowDividendCalculationForInactiveClients?: boolean;
  charges?: FineractShareAccountCharge[];
  dividends?: FineractShareAccountDividend[];
  /** Present when GET ?template=true */
  productOptions?: FineractShareAccountProductOption[];
  chargeOptions?: FineractShareAccountChargeOption[];
  clientSavingsAccounts?: FineractShareAccountSavingsOption[];
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  minimumActivePeriodFrequencyTypeOptions?: FineractEnumOption[];
}

export interface CreateShareAccountResponse {
  officeId?: number;
  clientId?: number;
  resourceId?: number;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAccountStatus, FineractCurrencyOption } from './accounts-types';
import type { FineractEnumOption } from './types';

export interface FineractSavingsAccountSummary {
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalInterestEarned?: number;
  totalInterestPosted?: number;
  accountBalance?: number;
  availableBalance?: number;
  totalFeeCharge?: number;
  totalPenaltyCharge?: number;
  totalAnnualFees?: number;
  totalOverdraftInterestDerived?: number;
  interestNotPosted?: number;
}

export interface FineractSavingsAccountTimeline {
  submittedOnDate?: number[] | string;
  submittedByUsername?: string;
  submittedByFirstname?: string;
  submittedByLastname?: string;
  approvedOnDate?: number[] | string;
  approvedByUsername?: string;
  approvedByFirstname?: string;
  approvedByLastname?: string;
  activatedOnDate?: number[] | string;
  activatedByUsername?: string;
  activatedByFirstname?: string;
  activatedByLastname?: string;
  closedOnDate?: number[] | string;
  closedByUsername?: string;
  closedByFirstname?: string;
  closedByLastname?: string;
  rejectedOnDate?: number[] | string;
  rejectedByUsername?: string;
  rejectedByFirstname?: string;
  rejectedByLastname?: string;
  withdrawnOnDate?: number[] | string;
  withdrawnByUsername?: string;
  withdrawnByFirstname?: string;
  withdrawnByLastname?: string;
}

export interface FineractSavingsAccountSubStatus {
  block?: boolean;
  blockCredit?: boolean;
  blockDebit?: boolean;
}

export interface FineractSavingsAccountTransaction {
  id: number;
  externalId?: string;
  transactionType?: FineractEnumOption & {
    deposit?: boolean;
    withdrawal?: boolean;
    debit?: boolean;
    credit?: boolean;
    interestPosting?: boolean;
    feeDeduction?: boolean;
    accrual?: boolean;
    overdraftInterest?: boolean;
    withholdTax?: boolean;
  };
  entryType?: { id?: number; code?: string; value?: string };
  amount: number;
  runningBalance?: number;
  /** Business transaction date (preferred for display). */
  date?: number[] | string;
  submittedOnDate?: number[] | string;
  createdDate?: number[] | string;
  reversed?: boolean;
  note?: string;
  currency?: FineractCurrencyOption;
  transfer?: {
    id?: number;
    reversed?: boolean;
    transferDescription?: string;
  };
  paymentDetailData?: {
    paymentType?: { id?: number; name?: string };
    accountNumber?: string;
    checkNumber?: string;
    routingCode?: string;
    receiptNumber?: string;
    bankNumber?: string;
  };
  submittedByUsername?: string;
}

export interface FineractSavingsAccountCharge {
  id: number;
  chargeId?: number;
  name: string;
  chargeTimeType?: FineractEnumOption;
  dueDate?: number[] | string;
  amount?: number;
  amountPaid?: number;
  amountWaived?: number;
  amountWrittenOff?: number;
  amountOutstanding?: number;
  chargeCalculationType?: FineractEnumOption;
  penalty?: boolean;
  isActive?: boolean;
  isPaid?: boolean;
  isWaived?: boolean;
}

export interface FineractSavingsAccountDetail {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId?: number;
  clientName?: string;
  savingsProductId?: number;
  savingsProductName?: string;
  productName?: string;
  shortProductName?: string;
  status: FineractClientAccountStatus;
  subStatus?: FineractSavingsAccountSubStatus;
  currency: FineractCurrencyOption;
  depositType?: FineractEnumOption;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestPostingPeriodType?: FineractEnumOption;
  interestCalculationType?: FineractEnumOption;
  interestCalculationDaysInYearType?: FineractEnumOption;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  minOverdraftForInterestCalculation?: number;
  nominalAnnualInterestRateOverdraft?: number;
  lastActiveTransactionDate?: number[] | string;
  onHoldFunds?: number;
  savingsAmountOnHold?: number;
  summary?: FineractSavingsAccountSummary;
  timeline?: FineractSavingsAccountTimeline;
  transactions?: FineractSavingsAccountTransaction[];
  charges?: FineractSavingsAccountCharge[];
  fieldOfficerId?: number;
  fieldOfficerName?: string;
  officeId?: number;
  officeName?: string;
  taxGroup?: { id?: number; name?: string };
  withHoldTax?: boolean;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertLoanProductInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

/** Fineract option list ids are 1-based; API expects enum name strings. */
const LOAN_SCHEDULE_TYPE_CODES = ['CUMULATIVE', 'PROGRESSIVE'] as const;
const LOAN_SCHEDULE_PROCESSING_TYPE_CODES = ['HORIZONTAL', 'VERTICAL'] as const;

function enumCodeFromOptionListId(
  codes: readonly string[],
  id: number | undefined
): string | undefined {
  if (id == null) {
    return undefined;
  }
  const index = id - 1;
  if (index < 0 || index >= codes.length) {
    return undefined;
  }
  return codes[index];
}

/** Build Fineract POST/PUT body from wizard draft. */
export function buildLoanProductPayload(input: UpsertLoanProductInput): Record<string, unknown> {
  const { details, currency, terms, settings, charges, accounting } = input;

  const payload: Record<string, unknown> = {
    ...details,
    ...currency,
    ...terms,
    ...settings,
    accountingRule: accounting.accountingRule,
    fundSourceAccountId: accounting.fundSourceAccountId,
    loanPortfolioAccountId: accounting.loanPortfolioAccountId,
    transfersInSuspenseAccountId: accounting.transfersInSuspenseAccountId,
    interestOnLoanAccountId: accounting.interestOnLoanAccountId,
    incomeFromFeeAccountId: accounting.incomeFromFeeAccountId,
    incomeFromPenaltyAccountId: accounting.incomeFromPenaltyAccountId,
    incomeFromRecoveryAccountId: accounting.incomeFromRecoveryAccountId,
    writeOffAccountId: accounting.writeOffAccountId,
    overpaymentLiabilityAccountId: accounting.overpaymentLiabilityAccountId,
    receivableInterestAccountId: accounting.receivableInterestAccountId,
    receivableFeeAccountId: accounting.receivableFeeAccountId,
    receivablePenaltyAccountId: accounting.receivablePenaltyAccountId,
    goodwillCreditAccountId: accounting.goodwillCreditAccountId,
    chargeOffExpenseAccountId: accounting.chargeOffExpenseAccountId,
    chargeOffFraudExpenseAccountId: accounting.chargeOffFraudExpenseAccountId,
    incomeFromChargeOffInterestAccountId: accounting.incomeFromChargeOffInterestAccountId,
    incomeFromChargeOffFeesAccountId: accounting.incomeFromChargeOffFeesAccountId,
    incomeFromChargeOffPenaltyAccountId: accounting.incomeFromChargeOffPenaltyAccountId,
    incomeFromGoodwillCreditInterestAccountId: accounting.incomeFromGoodwillCreditInterestAccountId,
    incomeFromGoodwillCreditFeesAccountId: accounting.incomeFromGoodwillCreditFeesAccountId,
    incomeFromGoodwillCreditPenaltyAccountId: accounting.incomeFromGoodwillCreditPenaltyAccountId,
    charges: charges.chargeIds.map((id) => ({ id })),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };

  if (accounting.paymentChannelToFundSourceMappings?.length) {
    payload.paymentChannelToFundSourceMappings = accounting.paymentChannelToFundSourceMappings.map(
      (row) => ({
        paymentTypeId: row.paymentTypeId,
        fundSourceAccountId: row.fundSourceAccountId
      })
    );
  }

  if (accounting.feeToIncomeAccountMappings?.length) {
    payload.feeToIncomeAccountMappings = accounting.feeToIncomeAccountMappings.map((row) => ({
      chargeId: row.chargeId,
      incomeAccountId: row.incomeAccountId
    }));
  }

  if (accounting.penaltyToIncomeAccountMappings?.length) {
    payload.penaltyToIncomeAccountMappings = accounting.penaltyToIncomeAccountMappings.map(
      (row) => ({
        chargeId: row.chargeId,
        incomeAccountId: row.incomeAccountId
      })
    );
  }

  // Fineract rejects 0 — omit when unset (matches Angular currency step).
  if (currency.inMultiplesOf == null || currency.inMultiplesOf <= 0) {
    delete payload.inMultiplesOf;
  }

  if (
    currency.installmentAmountInMultiplesOf == null ||
    currency.installmentAmountInMultiplesOf <= 0
  ) {
    delete payload.installmentAmountInMultiplesOf;
  }

  const isAccrualAccounting = accounting.accountingRule === 3 || accounting.accountingRule === 4;
  if (isAccrualAccounting) {
    payload.enableAccrualActivityPosting = accounting.enableAccrualActivityPosting ?? false;
  } else {
    delete payload.enableAccrualActivityPosting;
  }

  if (settings.useDueForRepaymentsConfigurations) {
    payload.dueDaysForRepaymentEvent = null;
    payload.overDueDaysForRepaymentEvent = null;
  }
  // Wizard-only toggle; Fineract create/update does not accept this parameter.
  delete payload.useDueForRepaymentsConfigurations;
  // Older Fineract versions reject this parameter entirely (even when false).
  delete payload.allowAccrualPostingInArrears;

  if (terms.isLinkedToFloatingInterestRates) {
    delete payload.minInterestRatePerPeriod;
    delete payload.maxInterestRatePerPeriod;
    delete payload.interestRatePerPeriod;
    delete payload.interestRateFrequencyType;
  } else {
    delete payload.floatingRatesId;
    delete payload.interestRateDifferential;
    delete payload.minDifferentialLendingRate;
    delete payload.defaultDifferentialLendingRate;
    delete payload.maxDifferentialLendingRate;
    delete payload.isFloatingInterestRateCalculationAllowed;
  }

  const loanScheduleType = enumCodeFromOptionListId(
    LOAN_SCHEDULE_TYPE_CODES,
    settings.loanScheduleType
  );
  if (loanScheduleType) {
    payload.loanScheduleType = loanScheduleType;
  } else {
    delete payload.loanScheduleType;
  }

  const loanScheduleProcessingType = enumCodeFromOptionListId(
    LOAN_SCHEDULE_PROCESSING_TYPE_CODES,
    settings.loanScheduleProcessingType
  );
  if (loanScheduleProcessingType) {
    payload.loanScheduleProcessingType = loanScheduleProcessingType;
  } else {
    delete payload.loanScheduleProcessingType;
  }

  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }

  return payload;
}

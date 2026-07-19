/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertSavingsProductInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

/** Build Fineract POST/PUT body from wizard draft. */
export function buildSavingsProductPayload(
  input: UpsertSavingsProductInput
): Record<string, unknown> {
  const { details, currency, terms, settings, charges, accounting } = input;
  const { enableLockinPeriod: _enableLockinPeriod, ...settingsPayload } = settings;

  const payload: Record<string, unknown> = {
    ...details,
    ...currency,
    ...terms,
    ...settingsPayload,
    accountingRule: accounting.accountingRule,
    savingsReferenceAccountId: accounting.savingsReferenceAccountId,
    overdraftPortfolioControlId: accounting.overdraftPortfolioControlId,
    savingsControlAccountId: accounting.savingsControlAccountId,
    transfersInSuspenseAccountId: accounting.transfersInSuspenseAccountId,
    interestOnSavingsAccountId: accounting.interestOnSavingsAccountId,
    writeOffAccountId: accounting.writeOffAccountId,
    incomeFromFeeAccountId: accounting.incomeFromFeeAccountId,
    incomeFromPenaltyAccountId: accounting.incomeFromPenaltyAccountId,
    incomeFromInterestId: accounting.incomeFromInterestId,
    feesReceivableAccountId: accounting.feesReceivableAccountId,
    penaltiesReceivableAccountId: accounting.penaltiesReceivableAccountId,
    interestReceivableAccountId: accounting.interestReceivableAccountId,
    interestPayableAccountId: accounting.interestPayableAccountId,
    escheatLiabilityId: accounting.escheatLiabilityId,
    charges: charges.chargeIds.map((id) => ({ id })),
    locale: FINERACT_LOCALE
  };

  if (!settings.enableLockinPeriod) {
    delete payload.lockinPeriodFrequency;
    delete payload.lockinPeriodFrequencyType;
  }

  if (!settings.allowOverdraft) {
    delete payload.minOverdraftForInterestCalculation;
    delete payload.nominalAnnualInterestRateOverdraft;
    delete payload.overdraftLimit;
    delete payload.interestReceivableAccountId;
  }

  if (!settings.withHoldTax) {
    delete payload.taxGroupId;
  }

  if (!settings.isDormancyTrackingActive) {
    delete payload.daysToInactive;
    delete payload.daysToDormancy;
    delete payload.daysToEscheat;
    delete payload.escheatLiabilityId;
  }

  if (accounting.accountingRule === 1) {
    for (const key of [
      'savingsReferenceAccountId',
      'overdraftPortfolioControlId',
      'savingsControlAccountId',
      'transfersInSuspenseAccountId',
      'interestOnSavingsAccountId',
      'writeOffAccountId',
      'incomeFromFeeAccountId',
      'incomeFromPenaltyAccountId',
      'incomeFromInterestId',
      'feesReceivableAccountId',
      'penaltiesReceivableAccountId',
      'interestReceivableAccountId',
      'interestPayableAccountId',
      'escheatLiabilityId'
    ]) {
      delete payload[key];
    }
  } else if (accounting.accountingRule === 2) {
    delete payload.feesReceivableAccountId;
    delete payload.penaltiesReceivableAccountId;
    delete payload.interestPayableAccountId;
    delete payload.interestReceivableAccountId;
  }

  const filterMappings = <T extends Record<string, number>>(
    rows: T[] | undefined,
    keys: [keyof T, keyof T]
  ) => (rows ?? []).filter((row) => row[keys[0]] > 0 && row[keys[1]] > 0);

  const paymentChannelToFundSourceMappings = filterMappings(
    accounting.paymentChannelToFundSourceMappings,
    ['paymentTypeId', 'fundSourceAccountId']
  );
  if (paymentChannelToFundSourceMappings.length) {
    payload.paymentChannelToFundSourceMappings = paymentChannelToFundSourceMappings;
  }

  const feeToIncomeAccountMappings = filterMappings(accounting.feeToIncomeAccountMappings, [
    'chargeId',
    'incomeAccountId'
  ]);
  if (feeToIncomeAccountMappings.length) {
    payload.feeToIncomeAccountMappings = feeToIncomeAccountMappings;
  }

  const penaltyToIncomeAccountMappings = filterMappings(
    accounting.penaltyToIncomeAccountMappings,
    ['chargeId', 'incomeAccountId']
  );
  if (penaltyToIncomeAccountMappings.length) {
    payload.penaltyToIncomeAccountMappings = penaltyToIncomeAccountMappings;
  }

  if (currency.inMultiplesOf == null || currency.inMultiplesOf <= 0) {
    delete payload.inMultiplesOf;
  }

  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }

  return payload;
}

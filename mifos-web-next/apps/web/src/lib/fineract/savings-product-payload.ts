/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertSavingsProductInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { buildProductChargesPayload } from '@/lib/fineract/product-charge-links';

/**
 * Rebuild the catalog from the current draft. One row per payment type.
 * Charge `id` is the charge definition id. Link-row ids from GET are not sent.
 */
function buildPaymentChannelsPayload(
  channels: UpsertSavingsProductInput['paymentChannels']['channels']
): Array<{
  paymentTypeId: number;
  isPremium: boolean;
  isActive: boolean;
  charges: Array<{ id: number; amount?: number }>;
}> {
  const seenTypes = new Set<number>();
  const rows: Array<{
    paymentTypeId: number;
    isPremium: boolean;
    isActive: boolean;
    charges: Array<{ id: number; amount?: number }>;
  }> = [];

  for (const row of channels) {
    if (seenTypes.has(row.paymentTypeId)) {
      continue;
    }
    seenTypes.add(row.paymentTypeId);
    const seenCharges = new Set<number>();
    const chargeIds = (row.isPremium ? (row.chargeIds ?? []) : []).filter((id) => {
      if (seenCharges.has(id)) {
        return false;
      }
      seenCharges.add(id);
      return true;
    });
    rows.push({
      paymentTypeId: row.paymentTypeId,
      isPremium: row.isPremium,
      isActive: row.isActive,
      charges: buildProductChargesPayload(chargeIds, row.chargeAmounts)
    });
  }

  return rows;
}

/** Build Fineract POST/PUT body from wizard draft. */
export function buildSavingsProductPayload(
  input: UpsertSavingsProductInput
): Record<string, unknown> {
  const { details, currency, terms, settings, charges, paymentChannels, accounting } = input;
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
    charges: buildProductChargesPayload(charges.chargeIds, charges.chargeAmounts),
    paymentChannels: buildPaymentChannelsPayload(paymentChannels?.channels ?? []),
    dateFormat: FINERACT_DATE_FORMAT,
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

  if (accounting.paymentChannelToFundSourceMappings?.length) {
    payload.paymentChannelToFundSourceMappings = accounting.paymentChannelToFundSourceMappings;
  }
  if (accounting.feeToIncomeAccountMappings?.length) {
    payload.feeToIncomeAccountMappings = accounting.feeToIncomeAccountMappings;
  }
  if (accounting.penaltyToIncomeAccountMappings?.length) {
    payload.penaltyToIncomeAccountMappings = accounting.penaltyToIncomeAccountMappings;
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

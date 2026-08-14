/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertDepositProductInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, normalizeFineractDateField } from '@/lib/fineract/dates';
import { buildProductChargesPayload } from '@/lib/fineract/product-charge-links';

/** Build Fineract POST/PUT body from wizard draft. */
export function buildDepositProductPayload(
  input: UpsertDepositProductInput
): Record<string, unknown> {
  const { details, currency, terms, settings, interestRateChart, charges, accounting, variant } =
    input;
  const { enableLockinPeriod: _enableLockinPeriod, ...settingsPayload } = settings;

  const payload: Record<string, unknown> = {
    ...details,
    ...currency,
    ...terms,
    ...settingsPayload,
    accountingRule: accounting.accountingRule,
    savingsReferenceAccountId: accounting.savingsReferenceAccountId,
    savingsControlAccountId: accounting.savingsControlAccountId,
    transfersInSuspenseAccountId: accounting.transfersInSuspenseAccountId,
    interestOnSavingsAccountId: accounting.interestOnSavingsAccountId,
    incomeFromFeeAccountId: accounting.incomeFromFeeAccountId,
    incomeFromPenaltyAccountId: accounting.incomeFromPenaltyAccountId,
    feesReceivableAccountId: accounting.feesReceivableAccountId,
    penaltiesReceivableAccountId: accounting.penaltiesReceivableAccountId,
    interestPayableAccountId: accounting.interestPayableAccountId,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };

  if (variant === 'fixed') {
    delete payload.isMandatoryDeposit;
    delete payload.adjustAdvanceTowardsFuturePayments;
    delete payload.allowWithdrawal;
  }

  if (!settings.enableLockinPeriod) {
    delete payload.lockinPeriodFrequency;
    delete payload.lockinPeriodFrequencyType;
  }

  if (!settings.preClosurePenalApplicable) {
    delete payload.preClosurePenalInterest;
    delete payload.preClosurePenalInterestOnTypeId;
  }

  if (!settings.withHoldTax) {
    delete payload.taxGroupId;
  }

  if (accounting.accountingRule === 1) {
    for (const key of [
      'savingsReferenceAccountId',
      'savingsControlAccountId',
      'transfersInSuspenseAccountId',
      'interestOnSavingsAccountId',
      'incomeFromFeeAccountId',
      'incomeFromPenaltyAccountId',
      'feesReceivableAccountId',
      'penaltiesReceivableAccountId',
      'interestPayableAccountId'
    ]) {
      delete payload[key];
    }
  } else if (accounting.accountingRule === 2) {
    delete payload.feesReceivableAccountId;
    delete payload.penaltiesReceivableAccountId;
    delete payload.interestPayableAccountId;
  }

  if (accounting.advancedAccountingRules) {
    if (accounting.paymentChannelToFundSourceMappings?.length) {
      payload.paymentChannelToFundSourceMappings = accounting.paymentChannelToFundSourceMappings;
    }
    if (accounting.feeToIncomeAccountMappings?.length) {
      payload.feeToIncomeAccountMappings = accounting.feeToIncomeAccountMappings;
    }
    if (accounting.penaltyToIncomeAccountMappings?.length) {
      payload.penaltyToIncomeAccountMappings = accounting.penaltyToIncomeAccountMappings;
    }
  }

  if (charges.chargeIds.length) {
    payload.charges = buildProductChargesPayload(charges.chargeIds, charges.chargeAmounts);
  }

  const charts = interestRateChart.charts.map((chart) => {
    const row: Record<string, unknown> = {
      name: chart.name || undefined,
      description: chart.description || undefined,
      fromDate: normalizeFineractDateField(chart.fromDate),
      endDate: normalizeFineractDateField(chart.endDate),
      isPrimaryGroupingByAmount: chart.isPrimaryGroupingByAmount,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE,
      chartSlabs: chart.chartSlabs.map((slab) => {
        const slabRow: Record<string, unknown> = {
          periodType: slab.periodType,
          fromPeriod: slab.fromPeriod,
          toPeriod: slab.toPeriod,
          amountRangeFrom: slab.amountRangeFrom,
          amountRangeTo: slab.amountRangeTo,
          annualInterestRate: slab.annualInterestRate,
          description: slab.description,
          incentives: (slab.incentives ?? []).map((incentive) => ({
            entityType: incentive.entityType,
            attributeName: incentive.attributeName,
            conditionType: incentive.conditionType,
            attributeValue: incentive.attributeValue,
            incentiveType: incentive.incentiveType,
            amount: incentive.amount
          }))
        };
        if (slab.id) {
          slabRow.id = slab.id;
        }
        return slabRow;
      })
    };
    if (chart.id) {
      row.id = chart.id;
    }
    return row;
  });

  payload.charts = charts;

  if (currency.inMultiplesOf == null || currency.inMultiplesOf <= 0) {
    delete payload.inMultiplesOf;
  }

  delete payload.variant;
  delete payload.enableLockinPeriod;
  delete payload.advancedAccountingRules;

  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }

  return payload;
}

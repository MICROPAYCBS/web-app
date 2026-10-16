/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE,
  loanScheduleFieldsForStrategy
} from './loan-product-fineract-rules';
import {
  omitLoanProductFieldErrors,
  placeLoanProductFieldErrors
} from './loan-product-field-errors';
import {
  loanProductSettingsStepSchema,
  loanProductTermsStepSchema,
  upsertLoanProductSchema
} from './loan-product.schema';

const fixedInterestTerms = {
  isLinkedToFloatingInterestRates: false,
  principal: 9_300_000,
  numberOfRepayments: 12,
  repaymentEvery: 1,
  repaymentFrequencyType: 2,
  interestRatePerPeriod: 40,
  maxInterestRatePerPeriod: 80
};

const baseSettings = {
  amortizationType: 1,
  interestType: 0,
  interestCalculationPeriodType: 1,
  transactionProcessingStrategyCode: 'mifos-standard-strategy',
  daysInYearType: 1,
  daysInMonthType: 1,
  loanScheduleType: 1,
  overdueDaysForNPA: 90
};

describe('loanProductTermsStepSchema', () => {
  it('accepts whole term interest rate frequency (Fineract id 4)', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      ...fixedInterestTerms,
      interestRateFrequencyType: 4
    });
    assert.equal(parsed.success, true);
  });

  it('rejects whole term on repayment frequency (Fineract id 4)', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      ...fixedInterestTerms,
      repaymentFrequencyType: 4
    });
    assert.equal(parsed.success, false);
  });

  it('rejects invalid interest rate frequency ids', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      ...fixedInterestTerms,
      interestRateFrequencyType: 5
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.match(parsed.error.issues[0]?.message ?? '', /interest rate frequency/i);
    }
  });

  it('validates principal within min and max', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      ...fixedInterestTerms,
      interestRateFrequencyType: 4,
      minPrincipal: 10_000_000,
      maxPrincipal: 8_000_000
    });
    assert.equal(parsed.success, false);
  });

  it('requires an interest rate differential when floating rates are linked', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      isLinkedToFloatingInterestRates: true,
      principal: 1000,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      floatingRatesId: 4,
      minDifferentialLendingRate: 1,
      defaultDifferentialLendingRate: 2,
      maxDifferentialLendingRate: 4,
      isFloatingInterestRateCalculationAllowed: true
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(
        parsed.error.issues.some((issue) => issue.path.join('.') === 'interestRateDifferential')
      );
    }
  });

  it('accepts a complete floating-rate draft', () => {
    const parsed = loanProductTermsStepSchema.safeParse({
      isLinkedToFloatingInterestRates: true,
      principal: 1000,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      floatingRatesId: 4,
      interestRateDifferential: 2,
      minDifferentialLendingRate: 1,
      defaultDifferentialLendingRate: 2,
      maxDifferentialLendingRate: 4,
      isFloatingInterestRateCalculationAllowed: true
    });
    assert.equal(parsed.success, true);
  });
});

describe('loanProductSettingsStepSchema', () => {
  it('accepts Fineract days-in-year values', () => {
    for (const daysInYearType of [1, 360, 364, 365] as const) {
      const parsed = loanProductSettingsStepSchema.safeParse({
        ...baseSettings,
        daysInYearType
      });
      assert.equal(parsed.success, true, `expected ${daysInYearType} to pass`);
    }
  });

  it('rejects invalid days-in-year values', () => {
    const parsed = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      daysInYearType: 2
    });
    assert.equal(parsed.success, false);
  });

  it('requires down payment percentage when down payment is enabled', () => {
    const parsed = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      enableDownPayment: true
    });
    assert.equal(parsed.success, false);
  });

  it('accepts down payment percentage when down payment is enabled', () => {
    const parsed = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      enableDownPayment: true,
      disbursedAmountPercentageForDownPayment: 25
    });
    assert.equal(parsed.success, true);
  });

  it('ignores a stored tranche count of 0 when multi-disburse is off', () => {
    const parsed = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      multiDisburseLoan: false,
      maxTrancheCount: 0
    });
    assert.equal(parsed.success, true);
  });

  it('requires a tranche count of at least 1 when multi-disburse is on', () => {
    const parsed = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      multiDisburseLoan: true,
      maxTrancheCount: 0
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(
        parsed.error.issues.some((issue) => issue.path.join('.') === 'maxTrancheCount')
      );
    }
  });

  it('requires overdue days for NPA and rejects 0', () => {
    const { overdueDaysForNPA: _kept, ...withoutNpa } = baseSettings;
    const missing = loanProductSettingsStepSchema.safeParse(withoutNpa);
    const zero = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      overdueDaysForNPA: 0
    });
    const blank = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      overdueDaysForNPA: undefined
    });
    const accepted = loanProductSettingsStepSchema.safeParse({
      ...baseSettings,
      overdueDaysForNPA: 90
    });

    assert.equal(missing.success, false);
    assert.equal(zero.success, false);
    assert.equal(blank.success, false);
    assert.equal(accepted.success, true);

    for (const parsed of [missing, zero, blank]) {
      if (!parsed.success) {
        assert.match(
          parsed.error.issues.find((issue) => issue.path.join('.') === 'overdueDaysForNPA')
            ?.message ?? '',
          /non-performing/
        );
      }
    }
  });

  it('rejects a progressive schedule unless the strategy is advanced payment allocation', () => {
      const rejected = loanProductSettingsStepSchema.safeParse({
        ...baseSettings,
        loanScheduleType: 2
      });
      const accepted = loanProductSettingsStepSchema.safeParse({
        ...baseSettings,
        transactionProcessingStrategyCode: ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE,
        loanScheduleType: 2,
        loanScheduleProcessingType: 2
      });
      const cumulativeWithAdvanced = loanProductSettingsStepSchema.safeParse({
        ...baseSettings,
        transactionProcessingStrategyCode: ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE,
        loanScheduleType: 1
      });
      const verticalWithoutAdvanced = loanProductSettingsStepSchema.safeParse({
        ...baseSettings,
        loanScheduleProcessingType: 2
      });

      assert.equal(rejected.success, false);
      assert.equal(accepted.success, true);
      assert.equal(cumulativeWithAdvanced.success, false);
      assert.equal(verticalWithoutAdvanced.success, false);
      if (!rejected.success) {
        assert.match(
          rejected.error.issues.find((issue) => issue.path.join('.') === 'loanScheduleType')?.message ??
            '',
          /Advanced payment allocation/
        );
      }
    });

    it('aligns schedule fields with the selected repayment strategy', () => {
      assert.deepEqual(
        loanScheduleFieldsForStrategy({
          transactionProcessingStrategyCode: 'mifos-standard-strategy',
          loanScheduleType: 2,
          loanScheduleProcessingType: 2
        }),
        { loanScheduleType: 1, loanScheduleProcessingType: 1 }
      );
      assert.equal(
        loanScheduleFieldsForStrategy({
          transactionProcessingStrategyCode: ADVANCED_PAYMENT_ALLOCATION_STRATEGY_CODE,
          loanScheduleType: 2,
          loanScheduleProcessingType: 2
        }),
        null
      );
    });

  it('places loan schedule errors on the settings step and drops them when that field changes', () => {
    const placed = placeLoanProductFieldErrors({
      loanScheduleType: 'Progressive schedule requires the Advanced payment allocation repayment strategy.',
      dateFormat: 'Unsupported format.'
    });
    assert.deepEqual(placed.stepIds, ['settings']);
    assert.equal(
      placed.steps.settings?.['settings.loanScheduleType'],
      'Progressive schedule requires the Advanced payment allocation repayment strategy.'
    );
    assert.equal(placed.unmapped.dateFormat, 'Unsupported format.');

    const cleared = omitLoanProductFieldErrors(
      { loanScheduleType: 'Progressive schedule requires the Advanced payment allocation repayment strategy.', principal: 'Too high.' },
      ['loanScheduleType']
    );
    assert.deepEqual(cleared, { principal: 'Too high.' });

    const fromServer = placeLoanProductFieldErrors({
      'settings.overdueDaysForNPA': '0 marks every overdue loan as non-performing at once.',
      'settings.allowAttributeOverrides.amortizationType': 'Cannot override amortization.',
      dateFormat: 'Unsupported format.'
    });
    assert.deepEqual(fromServer.stepIds, ['settings']);
    assert.equal(
      fromServer.steps.settings?.['settings.overdueDaysForNPA'],
      '0 marks every overdue loan as non-performing at once.'
    );
    assert.equal(
      fromServer.steps.settings?.['settings.allowAttributeOverrides.amortizationType'],
      'Cannot override amortization.'
    );
    assert.equal(fromServer.unmapped.dateFormat, 'Unsupported format.');

    const clearedPrefixed = omitLoanProductFieldErrors(
      {
        'settings.overdueDaysForNPA': '0 marks every overdue loan as non-performing at once.',
        'settings.daysInYearType': 'Select a valid days-in-year type.'
      },
      ['overdueDaysForNPA']
    );
    assert.deepEqual(clearedPrefixed, {
      'settings.daysInYearType': 'Select a valid days-in-year type.'
    });
    const terms = placeLoanProductFieldErrors(cleared);
    assert.deepEqual(terms.stepIds, ['terms']);
  });
});

describe('upsertLoanProductSchema', () => {
  it('rejects grace on principal that equals repayments', () => {
    const parsed = upsertLoanProductSchema.safeParse({
      details: { name: 'Loan', shortName: 'LN' },
      currency: { currencyCode: 'UGX', digitsAfterDecimal: 2 },
      terms: {
        ...fixedInterestTerms,
        interestRateFrequencyType: 4
      },
      settings: {
        ...baseSettings,
        graceOnPrincipalPayment: 12
      },
      charges: { chargeIds: [], chargeAmounts: {} },
      accounting: {
        accountingRule: 2,
        fundSourceAccountId: 1,
        loanPortfolioAccountId: 2,
        transfersInSuspenseAccountId: 3,
        interestOnLoanAccountId: 4,
        incomeFromFeeAccountId: 5,
        incomeFromPenaltyAccountId: 6,
        incomeFromRecoveryAccountId: 7,
        writeOffAccountId: 8,
        overpaymentLiabilityAccountId: 9
      }
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(
        parsed.error.issues.some((issue) => issue.path.join('.') === 'settings.graceOnPrincipalPayment')
      );
    }
  });
});

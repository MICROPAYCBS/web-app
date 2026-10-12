/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LoanProductTemplate } from '@mifos/api-client';
import type { UpsertLoanProductInput } from '@mifos/validation';
import { loanProductDraftFromTemplate } from './loan-product-draft';
import { buildLoanProductPayload } from './loan-product-payload';
import {
  loanProductDraftHasUnsavedChanges,
  sanitizeLoanProductDraftForSubmit
} from './product-wizard-draft-compare';

function minimalTemplate(overrides: Partial<LoanProductTemplate> = {}): LoanProductTemplate {
  return {
    name: 'Progressive loan',
    shortName: 'PL',
    currencyCode: 'UGX',
    principal: 1_000_000,
    numberOfRepayments: 12,
    repaymentEvery: 1,
    interestRatePerPeriod: 10,
    transactionProcessingStrategyCode: 'mifos-standard-strategy',
    ...overrides
  };
}

describe('loanProductDraftFromTemplate down payment', () => {
  it('maps down payment percentage and auto repayment from the edit template', () => {
    const draft = loanProductDraftFromTemplate(
      minimalTemplate({
        enableDownPayment: true,
        disbursedAmountPercentageForDownPayment: 25,
        enableAutoRepaymentForDownPayment: true
      }),
      'loan'
    );

    assert.equal(draft.settings.enableDownPayment, true);
    assert.equal(draft.settings.disbursedAmountPercentageForDownPayment, 25);
    assert.equal(draft.settings.enableAutoRepaymentForDownPayment, true);
  });

  it('parses string percentages from the API payload', () => {
    const draft = loanProductDraftFromTemplate(
      minimalTemplate({
        enableDownPayment: true,
        disbursedAmountPercentageForDownPayment: '33.333333' as unknown as number
      }),
      'loan'
    );

    assert.equal(draft.settings.disbursedAmountPercentageForDownPayment, 33.333333);
  });

  it('leaves overdue days for NPA unset when the template omits it', () => {
    const draft = loanProductDraftFromTemplate(minimalTemplate(), 'loan');
    assert.equal(draft.settings.overdueDaysForNPA, undefined);
  });

  it('maps saved tranche, gap, guarantee, and floating values', () => {
    const draft = loanProductDraftFromTemplate(
      minimalTemplate({
        multiDisburseLoan: true,
        maxTrancheCount: 3,
        allowVariableInstallments: true,
        minimumGap: 7,
        maximumGap: 30,
        holdGuaranteeFunds: true,
        productGuaranteeData: {
          mandatoryGuarantee: 20,
          minimumGuaranteeFromOwnFunds: 10,
          minimumGuaranteeFromGuarantor: 5
        },
        isLinkedToFloatingInterestRates: true,
        floatingRateId: 9,
        interestRateDifferential: 1.5,
        minDifferentialLendingRate: 1,
        defaultDifferentialLendingRate: 2,
        maxDifferentialLendingRate: 4,
        isFloatingInterestRateCalculationAllowed: true,
        isInterestRecalculationEnabled: true
      }),
      'loan'
    );

    assert.equal(draft.settings.maxTrancheCount, 3);
    assert.equal(draft.settings.minimumGap, 7);
    assert.equal(draft.settings.maximumGap, 30);
    assert.equal(draft.settings.mandatoryGuarantee, 20);
    assert.equal(draft.settings.minimumGuaranteeFromOwnFunds, 10);
    assert.equal(draft.settings.minimumGuaranteeFromGuarantor, 5);
    assert.equal(draft.terms.floatingRatesId, 9);
    assert.equal(draft.terms.interestRateDifferential, 1.5);
    assert.equal(draft.terms.minDifferentialLendingRate, 1);
    assert.equal(draft.terms.defaultDifferentialLendingRate, 2);
    assert.equal(draft.terms.maxDifferentialLendingRate, 4);
    assert.equal(draft.terms.isFloatingInterestRateCalculationAllowed, true);

    const edited = structuredClone(draft);
    edited.details.description = 'Updated description';
    const payload = buildLoanProductPayload(edited);
    assert.equal(payload.description, 'Updated description');
    assert.equal(payload.maxTrancheCount, 3);
    assert.equal(payload.minimumGap, 7);
    assert.equal(payload.maximumGap, 30);
    assert.equal(payload.mandatoryGuarantee, 20);
    assert.equal(payload.minimumGuaranteeFromOwnFunds, 10);
    assert.equal(payload.minimumGuaranteeFromGuarantor, 5);
    assert.equal(payload.floatingRatesId, 9);
    assert.equal(payload.interestRateDifferential, 1.5);
    assert.equal(payload.minDifferentialLendingRate, 1);
    assert.equal(payload.defaultDifferentialLendingRate, 2);
    assert.equal(payload.maxDifferentialLendingRate, 4);
    assert.equal(payload.isFloatingInterestRateCalculationAllowed, true);
    assert.equal('isInterestRecalculationEnabled' in payload, false);
  });

  it('maps saved schedule type codes onto option-list ids', () => {
    const options = [
      { id: 1, code: 'CUMULATIVE', value: 'Cumulative' },
      { id: 2, code: 'PROGRESSIVE', value: 'Progressive' }
    ];
    const cumulative = loanProductDraftFromTemplate(
      minimalTemplate({
        loanScheduleType: { id: 0, code: 'CUMULATIVE', value: 'Cumulative' },
        loanScheduleTypeOptions: options
      }),
      'loan'
    );
    const progressive = loanProductDraftFromTemplate(
      minimalTemplate({
        loanScheduleType: { id: 1, code: 'PROGRESSIVE', value: 'Progressive' },
        loanScheduleTypeOptions: options
      }),
      'loan'
    );

    assert.equal(cumulative.settings.loanScheduleType, 1);
    assert.equal(progressive.settings.loanScheduleType, 2);
  });
});

function minimalLoanProductDraft(
  overrides: Partial<UpsertLoanProductInput['settings']> = {}
): UpsertLoanProductInput {
  return {
    details: { name: 'Test Loan Product', shortName: 'TLP' },
    currency: { currencyCode: 'USD', digitsAfterDecimal: 2 },
    terms: {
      principal: 1000,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 5,
      interestRateFrequencyType: 2,
      isLinkedToFloatingInterestRates: false
    },
    settings: {
      amortizationType: 1,
      interestType: 0,
      interestCalculationPeriodType: 1,
      transactionProcessingStrategyCode: 'mifos-standard-strategy',
      daysInYearType: 1,
      daysInMonthType: 1,
      loanScheduleType: 1,
      useDueForRepaymentsConfigurations: false,
      ...overrides
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
  };
}

describe('loanProductDraftHasUnsavedChanges', () => {
  it('returns false when edit draft matches the loaded baseline', () => {
    const baseline = minimalLoanProductDraft({ enableDownPayment: true, disbursedAmountPercentageForDownPayment: 25 });
    const current = sanitizeLoanProductDraftForSubmit(structuredClone(baseline));

    assert.equal(loanProductDraftHasUnsavedChanges(current, baseline), false);
  });

  it('returns true when a settings field changes', () => {
    const baseline = minimalLoanProductDraft();
    const current = minimalLoanProductDraft({ graceOnPrincipalPayment: 2 });

    assert.equal(loanProductDraftHasUnsavedChanges(current, baseline), true);
  });

  it('treats an incomplete mapping row as unsaved work', () => {
    const baseline = minimalLoanProductDraft();
    const current = {
      ...structuredClone(baseline),
      accounting: {
        ...baseline.accounting,
        feeToIncomeAccountMappings: [{ chargeId: 0, incomeAccountId: 0 }]
      }
    };

    assert.equal(loanProductDraftHasUnsavedChanges(current, baseline), true);
  });
});

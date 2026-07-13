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
import {
  loanProductDraftFromTemplate,
  loanProductDraftHasUnsavedChanges,
  sanitizeLoanProductDraftForSubmit
} from './loan-product-draft';

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
    charges: { chargeIds: [] },
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

  it('ignores empty mapping rows when comparing drafts', () => {
    const baseline = minimalLoanProductDraft();
    const current = {
      ...structuredClone(baseline),
      accounting: {
        ...baseline.accounting,
        feeToIncomeAccountMappings: [{ chargeId: 0, incomeAccountId: 0 }]
      }
    };

    assert.equal(loanProductDraftHasUnsavedChanges(current, baseline), false);
  });
});

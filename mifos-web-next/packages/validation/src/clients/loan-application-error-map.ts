/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FieldError } from '../map-fineract-errors';

const LOAN_APPLICATION_FIELD_ALIASES: Record<string, string> = {
  principalAmount: 'principal',
  loanTermFrequencyType: 'loanTermFrequencyType',
  repaymentFrequencyType: 'repaymentFrequencyType',
  interestRateDifferential: 'interestRateDifferential',
  expectedFirstRepaymentOnDate: 'repaymentsStartingFromDate',
  repaymentsStartingFromDate: 'repaymentsStartingFromDate',
  submittedOnDate: 'submittedOnDate',
  expectedDisbursementDate: 'expectedDisbursementDate',
  transactionProcessingStrategyCode: 'transactionProcessingStrategyCode',
  graceOnPrincipalPayment: 'graceOnPrincipalPayment',
  graceOnInterestPayment: 'graceOnInterestPayment',
  graceOnInterestCharged: 'graceOnInterestCharged',
  linkAccountId: 'linkAccountId',
  createStandingInstructionAtDisbursement: 'createStandingInstructionAtDisbursement',
  externalId: 'externalId',
  productId: 'productId',
  loanOfficerId: 'loanOfficerId',
  loanPurposeId: 'loanPurposeId',
  fundId: 'fundId',
  numberOfRepayments: 'numberOfRepayments',
  repaymentEvery: 'repaymentEvery',
  interestRatePerPeriod: 'interestRatePerPeriod',
  amortizationType: 'amortizationType',
  interestType: 'interestType',
  interestCalculationPeriodType: 'interestCalculationPeriodType',
  collateral: 'collateral',
  charges: 'charges',
  disbursementData: 'disbursementData'
};

const LOAN_APPLICATION_USER_MESSAGES: Record<string, string> = {
  'validation.msg.loan.loanTermFrequencyType.not.the.same.as.repaymentFrequencyType':
    'Term frequency unit must match repayment frequency unit.',
  'validation.msg.loan.loanTermFrequency.less.than.repayment.structure.suggests':
    'Loan term is shorter than repayments × repay every.',
  'validation.msg.loan.loanTermFrequency.greater.than.repayment.structure.suggests':
    'Loan term is longer than repayments × repay every.',
  'validation.msg.loan.expectedDisbursementDate.cannot.be.after.first.repayment.date':
    'First repayment cannot be before expected disbursement.',
  'validation.msg.loan.graceOnPrincipalPayment.mustBeLessThan.numberOfRepayments':
    'Principal grace must be less than the number of repayments.',
  'validation.msg.loan.graceOnInterestPayment.mustBeLessThan.numberOfRepayments':
    'Interest payment grace must be less than the number of repayments.',
  'validation.msg.loan.graceOnInterestCharged.mustBeLessThan.numberOfRepayments':
    'Interest charged grace must be less than the number of repayments.',
  'validation.msg.loan.interestRatePerPeriod.not.supported.loanproduct.linked.to.floating.rate':
    'This product uses floating rates — enter the rate differential instead.',
  'validation.msg.loan.interestType.should.be.0.for.selected.loan.product':
    'Declining balance interest is required for floating-rate products.',
  'validation.msg.loan.linked.savings.account.is.not.active':
    'Linked savings account is not active.',
  'validation.msg.loan.linked.savings.account.not.belongs.to.same.client':
    'Linked account must belong to the same customer.',
  'error.msg.loan.with.externalId.already.used': 'External ID is already used on another loan.'
};

const LOAN_APPLICATION_SCHEDULE_PREVIEW_OMIT_FIELDS = new Set([
  'linkAccountId',
  'externalId',
  'createStandingInstructionAtDisbursement'
]);

const LOAN_APPLICATION_FIELD_LABELS: Record<string, string> = {
  linkAccountId: 'Linked savings account',
  createStandingInstructionAtDisbursement: 'Create standing instruction at disbursement',
  externalId: 'External ID'
};

function isRawParameterName(message: string, field: string): boolean {
  return message === field || /^[a-z][a-zA-Z0-9]*$/.test(message);
}

function loanApplicationFieldMessage(field: string, err: FieldError): string {
  if (err.code && LOAN_APPLICATION_USER_MESSAGES[err.code]) {
    return LOAN_APPLICATION_USER_MESSAGES[err.code];
  }
  if (err.message && !isRawParameterName(err.message, field)) {
    return err.message;
  }
  const label = LOAN_APPLICATION_FIELD_LABELS[field];
  if (label) {
    return `Review ${label.toLowerCase()} and try again.`;
  }
  return 'Some fields are invalid. Check the form and try again.';
}

export function mapLoanApplicationFineractErrors(
  fieldErrors: FieldError[],
  options?: { schedulePreview?: boolean }
): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const err of fieldErrors) {
    const formField = mapLoanApplicationFineractField(err.field);
    if (
      options?.schedulePreview &&
      LOAN_APPLICATION_SCHEDULE_PREVIEW_OMIT_FIELDS.has(formField)
    ) {
      continue;
    }
    const friendly = loanApplicationFieldMessage(formField, err);
    if (!mapped[formField]) {
      mapped[formField] = friendly;
    }
  }

  return mapped;
}

export function mapLoanApplicationFineractField(field: string): string {
  const base = field.split('.')[0] ?? field;
  return LOAN_APPLICATION_FIELD_ALIASES[base] ?? field;
}

export function loanApplicationStepForField(field: string): string | undefined {
  const core = new Set([
    'productId',
    'loanOfficerId',
    'loanPurposeId',
    'fundId',
    'externalId'
  ]);
  const financial = new Set([
    'principal',
    'loanTermFrequency',
    'loanTermFrequencyType',
    'numberOfRepayments',
    'repaymentEvery',
    'repaymentFrequencyType',
    'enableDownPayment'
  ]);
  const timeline = new Set([
    'interestRatePerPeriod',
    'interestRateDifferential',
    'submittedOnDate',
    'expectedDisbursementDate',
    'repaymentsStartingFromDate',
    'graceOnPrincipalPayment',
    'graceOnInterestPayment',
    'graceOnInterestCharged',
    'amortizationType',
    'interestType',
    'interestCalculationPeriodType',
    'transactionProcessingStrategyCode'
  ]);
  const security = new Set(['collateral', 'guarantors']);
  const payout = new Set([
    'linkAccountId',
    'createStandingInstructionAtDisbursement'
  ]);

  if (field.startsWith('charges')) {
    return 'charges';
  }
  if (field.startsWith('collateral') || field.startsWith('guarantors')) {
    return 'security';
  }
  if (core.has(field)) {
    return 'core';
  }
  if (financial.has(field)) {
    return 'financial';
  }
  if (timeline.has(field)) {
    return 'timeline';
  }
  if (field.startsWith('charges')) {
    return 'charges';
  }
  if (payout.has(field)) {
    return 'payout';
  }
  return undefined;
}

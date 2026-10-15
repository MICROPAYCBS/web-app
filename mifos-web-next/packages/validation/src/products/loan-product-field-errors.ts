/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Wizard step order used to open the earliest step that owns a server error. */
const LOAN_PRODUCT_STEP_ORDER = [
  'details',
  'currency',
  'settings',
  'terms',
  'charges',
  'accounting',
  'mappings'
] as const;

type LoanProductErrorSection = {
  stepId: (typeof LOAN_PRODUCT_STEP_ORDER)[number];
  /** Form error keys are `${prefix}.${parameter}`. */
  prefix: string;
  fields: ReadonlySet<string>;
};

function section(
  stepId: LoanProductErrorSection['stepId'],
  prefix: string,
  fields: readonly string[]
): LoanProductErrorSection {
  return { stepId, prefix, fields: new Set(fields) };
}

const SECTIONS: LoanProductErrorSection[] = [
  section('details', 'details', [
    'name',
    'shortName',
    'description',
    'externalId',
    'fundId',
    'startDate',
    'closeDate',
    'includeInBorrowerCycle'
  ]),
  section('currency', 'currency', [
    'currencyCode',
    'digitsAfterDecimal',
    'inMultiplesOf',
    'installmentAmountInMultiplesOf'
  ]),
  section('settings', 'settings', [
    'amortizationType',
    'interestType',
    'isEqualAmortization',
    'interestCalculationPeriodType',
    'allowPartialPeriodInterestCalculation',
    'transactionProcessingStrategyCode',
    'graceOnPrincipalPayment',
    'graceOnInterestPayment',
    'graceOnInterestCharged',
    'inArrearsTolerance',
    'daysInYearType',
    'daysInMonthType',
    'daysInYearCustomStrategy',
    'canDefineInstallmentAmount',
    'graceOnArrearsAgeing',
    'overdueDaysForNPA',
    'accountMovesOutOfNPAOnlyOnArrearsCompletion',
    'principalThresholdForLastInstallment',
    'allowVariableInstallments',
    'minimumGap',
    'maximumGap',
    'disallowExpectedDisbursements',
    'canUseForTopup',
    'isInterestRecalculationEnabled',
    'holdGuaranteeFunds',
    'mandatoryGuarantee',
    'minimumGuaranteeFromOwnFunds',
    'minimumGuaranteeFromGuarantor',
    'multiDisburseLoan',
    'maxTrancheCount',
    'allowFullTermForTranche',
    'enableDownPayment',
    'disbursedAmountPercentageForDownPayment',
    'enableAutoRepaymentForDownPayment',
    'enableInstallmentLevelDelinquency',
    'delinquencyBucketId',
    'useDueForRepaymentsConfigurations',
    'dueDaysForRepaymentEvent',
    'overDueDaysForRepaymentEvent',
    'loanScheduleType',
    'loanScheduleProcessingType',
    'syncExpectedWithDisbursementDate',
    'allowApprovedDisbursedAmountsOverApplied',
    'overAppliedCalculationType',
    'overAppliedNumber',
    'allowAttributeConfiguration',
    'allowAttributeOverrides'
  ]),
  section('terms', 'terms', [
    'isLinkedToFloatingInterestRates',
    'principal',
    'minPrincipal',
    'maxPrincipal',
    'numberOfRepayments',
    'minNumberOfRepayments',
    'maxNumberOfRepayments',
    'repaymentEvery',
    'repaymentFrequencyType',
    'interestRatePerPeriod',
    'minInterestRatePerPeriod',
    'maxInterestRatePerPeriod',
    'interestRateFrequencyType',
    'floatingRatesId',
    'interestRateDifferential',
    'minDifferentialLendingRate',
    'defaultDifferentialLendingRate',
    'maxDifferentialLendingRate',
    'isFloatingInterestRateCalculationAllowed',
    'repaymentStartDateType'
  ]),
  section('charges', 'charges', ['chargeIds', 'chargeAmounts', 'charges']),
  section('accounting', 'accounting', [
    'accountingRule',
    'enableAccrualActivityPosting',
    'fundSourceAccountId',
    'loanPortfolioAccountId',
    'transfersInSuspenseAccountId',
    'interestOnLoanAccountId',
    'incomeFromFeeAccountId',
    'incomeFromPenaltyAccountId',
    'incomeFromRecoveryAccountId',
    'writeOffAccountId',
    'overpaymentLiabilityAccountId',
    'receivableInterestAccountId',
    'receivableFeeAccountId',
    'receivablePenaltyAccountId',
    'goodwillCreditAccountId',
    'chargeOffExpenseAccountId',
    'chargeOffFraudExpenseAccountId',
    'incomeFromChargeOffInterestAccountId',
    'incomeFromChargeOffFeesAccountId',
    'incomeFromChargeOffPenaltyAccountId',
    'incomeFromGoodwillCreditInterestAccountId',
    'incomeFromGoodwillCreditFeesAccountId',
    'incomeFromGoodwillCreditPenaltyAccountId'
  ]),
  section('mappings', 'accounting', [
    'paymentChannelToFundSourceMappings',
    'feeToIncomeAccountMappings',
    'penaltyToIncomeAccountMappings'
  ])
];

export type PlacedLoanProductFieldErrors = {
  /** Form error keys grouped by wizard step id. */
  steps: Record<string, Record<string, string>>;
  /** Affected steps, earliest first. */
  stepIds: string[];
  /** Parameter names that do not belong to a wizard field. */
  unmapped: Record<string, string>;
};

function formKeyFor(sectionMatch: LoanProductErrorSection, field: string): string {
  if (field === 'charges') {
    return 'charges.chargeIds';
  }
  return `${sectionMatch.prefix}.${field}`;
}

/** Map API parameter names onto loan-product wizard steps and form keys. */
export function placeLoanProductFieldErrors(
  fieldErrors: Record<string, string> | undefined
): PlacedLoanProductFieldErrors {
  const steps: Record<string, Record<string, string>> = {};
  const unmapped: Record<string, string> = {};

  for (const [field, message] of Object.entries(fieldErrors ?? {})) {
    if (!message) {
      continue;
    }
    const root = field.split('.')[0] ?? field;
    const match = SECTIONS.find((item) => item.fields.has(root));
    if (!match) {
      unmapped[field] = message;
      continue;
    }
    const bucket = (steps[match.stepId] ??= {});
    const formKey = formKeyFor(match, field);
    if (!bucket[formKey]) {
      bucket[formKey] = message;
    }
  }

  const stepIds = LOAN_PRODUCT_STEP_ORDER.filter(
    (id) => steps[id] && Object.keys(steps[id]).length > 0
  );
  return { steps, stepIds, unmapped };
}

/** Drop server errors for fields the user just changed. */
export function omitLoanProductFieldErrors(
  fieldErrors: Record<string, string>,
  changedKeys: string[]
): Record<string, string> {
  if (changedKeys.length === 0) {
    return fieldErrors;
  }
  const changed = new Set(changedKeys);
  if (
    changed.has('chargeIds') ||
    changed.has('chargeAmounts') ||
    changed.has('charges')
  ) {
    changed.add('charges');
    changed.add('chargeIds');
    changed.add('chargeAmounts');
  }
  const next: Record<string, string> = {};
  for (const [field, message] of Object.entries(fieldErrors)) {
    const root = field.split('.')[0] ?? field;
    if (changed.has(root) || changed.has(field)) {
      continue;
    }
    next[field] = message;
  }
  return next;
}

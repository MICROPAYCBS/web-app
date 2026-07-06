/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import {
  createLoanAccountSchema,
  loanAccountCoreStepSchema,
  loanAccountFinancialStepSchema,
  loanAccountPayoutStepSchema,
  loanAccountChargesStepSchema,
  loanAccountSecurityStepSchema,
  loanAccountTimelineStepSchema,
  loanApplicationStepForField,
  validateLoanApplicationProductRangeRules,
  validateLoanApplicationChargeAmountRules,
  validateLoanApplicationProductRules
} from '@mifos/validation';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import {
  LOAN_APPLICATION_LIVE_RANGE_FIELDS,
  loanApplicationValidationContext
} from '@/lib/fineract/loan-application-rules';

export type LoanAccountStepErrors = Record<string, string>;

function flattenIssues(
  issues: { path: (string | number)[]; message: string }[]
): LoanAccountStepErrors {
  const errors: LoanAccountStepErrors = {};
  for (const issue of issues) {
    const key = issue.path.join('.') || String(issue.path[0] ?? 'form');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function mergeErrors(...maps: LoanAccountStepErrors[]): LoanAccountStepErrors {
  return Object.assign({}, ...maps);
}

function productRangeErrors(
  draft: LoanAccountDraft,
  template?: ClientLoanAccountTemplate
): LoanAccountStepErrors {
  if (!template || draft.productId <= 0) {
    return {};
  }
  return validateLoanApplicationProductRangeRules(
    draft,
    template ? loanApplicationValidationContext(template, draft) : undefined
  );
}

function stepProductRangeErrors(
  draft: LoanAccountDraft,
  template: ClientLoanAccountTemplate | undefined,
  fields: string[]
): LoanAccountStepErrors {
  const all = productRangeErrors(draft, template);
  return Object.fromEntries(
    Object.entries(all).filter(([key]) => fields.includes(key))
  );
}

function loanApplicationValidationContextForDraft(
  draft: LoanAccountDraft,
  template?: ClientLoanAccountTemplate
) {
  if (!template) {
    return undefined;
  }
  return loanApplicationValidationContext(template, draft);
}

function productRuleErrors(
  draft: LoanAccountDraft,
  template?: ClientLoanAccountTemplate,
  options?: Parameters<typeof validateLoanApplicationProductRules>[2]
): LoanAccountStepErrors {
  if (!template || draft.productId <= 0) {
    return {};
  }
  return validateLoanApplicationProductRules(
    draft,
    loanApplicationValidationContextForDraft(draft, template),
    options
  );
}

function stepProductRuleErrors(
  draft: LoanAccountDraft,
  template: ClientLoanAccountTemplate | undefined,
  fields: string[]
): LoanAccountStepErrors {
  const all = productRuleErrors(draft, template);
  return Object.fromEntries(
    Object.entries(all).filter(([key]) => fields.includes(key))
  );
}

function chargeAmountErrors(
  draft: LoanAccountDraft,
  template: ClientLoanAccountTemplate | undefined
): LoanAccountStepErrors {
  if (!template || draft.productId <= 0) {
    return {};
  }
  return validateLoanApplicationChargeAmountRules(
    draft,
    loanApplicationValidationContextForDraft(draft, template)
  );
}

export function validateLoanAccountStep(
  stepId: string,
  draft: LoanAccountDraft,
  template?: ClientLoanAccountTemplate,
  extraErrors: LoanAccountStepErrors = {}
): LoanAccountStepErrors {
  if (stepId === 'core') {
    const parsed = loanAccountCoreStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      stepProductRuleErrors(draft, template, ['productId', 'externalId']),
      extraErrors
    );
  }

  if (stepId === 'financial') {
    const parsed = loanAccountFinancialStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      stepProductRuleErrors(draft, template, [
        'principal',
        'loanTermFrequency',
        'loanTermFrequencyType',
        'numberOfRepayments',
        'repaymentEvery',
        'repaymentFrequencyType'
      ]),
      extraErrors
    );
  }

  if (stepId === 'timeline') {
    const parsed = loanAccountTimelineStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      stepProductRuleErrors(draft, template, [
        'interestRatePerPeriod',
        'interestRateDifferential',
        'interestType',
        'graceOnPrincipalPayment',
        'graceOnInterestPayment',
        'graceOnInterestCharged',
        'expectedDisbursementDate',
        'repaymentsStartingFromDate',
        'submittedOnDate',
        'amortizationType',
        'interestCalculationPeriodType',
        'transactionProcessingStrategyCode'
      ]),
      extraErrors
    );
  }

  if (stepId === 'charges') {
    const parsed = loanAccountChargesStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      chargeAmountErrors(draft, template),
      extraErrors
    );
  }

  if (stepId === 'security') {
    const parsed = loanAccountSecurityStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      extraErrors
    );
  }

  if (stepId === 'payout') {
    const parsed = loanAccountPayoutStepSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      stepProductRuleErrors(draft, template, ['linkAccountId', 'createStandingInstructionAtDisbursement']),
      extraErrors
    );
  }

  if (stepId === 'schedule') {
    const parsed = createLoanAccountSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      productRuleErrors(draft, template, { schedulePreview: true }),
      extraErrors
    );
  }

  if (stepId === 'preview') {
    const parsed = createLoanAccountSchema.safeParse(draft);
    return mergeErrors(
      parsed.success ? {} : flattenIssues(parsed.error.issues),
      productRuleErrors(draft, template),
      extraErrors
    );
  }

  return extraErrors;
}

export function resolveLoanAccountWizardStepErrors(
  stepId: string,
  draft: LoanAccountDraft,
  template: ClientLoanAccountTemplate | undefined,
  options: {
    validationAttempted: boolean;
    isReviewStep: boolean;
    serverFieldErrors: LoanAccountStepErrors;
  }
): LoanAccountStepErrors {
  if (options.isReviewStep) {
    return {};
  }

  const liveRangeFields = LOAN_APPLICATION_LIVE_RANGE_FIELDS[stepId] ?? [];
  const liveRangeErrors =
    liveRangeFields.length > 0
      ? stepProductRangeErrors(draft, template, liveRangeFields)
      : {};
  const liveChargeErrors = stepId === 'charges' ? chargeAmountErrors(draft, template) : {};

  const base = options.validationAttempted
    ? mergeErrors(
        validateLoanAccountStep(stepId, draft, template, options.serverFieldErrors),
        liveRangeErrors,
        liveChargeErrors
      )
    : mergeErrors(liveRangeErrors, liveChargeErrors);

  if (!options.validationAttempted && Object.keys(options.serverFieldErrors).length > 0) {
    return mergeErrors(
      base,
      Object.fromEntries(
        Object.entries(options.serverFieldErrors).filter(
          ([field]) => loanApplicationStepForField(field) === stepId
        )
      )
    );
  }

  return base;
}

export function mergeLoanAccountServerFieldErrors(
  current: LoanAccountStepErrors,
  serverErrors: Record<string, string> | undefined
): LoanAccountStepErrors {
  if (!serverErrors) {
    return current;
  }
  return { ...current, ...serverErrors };
}

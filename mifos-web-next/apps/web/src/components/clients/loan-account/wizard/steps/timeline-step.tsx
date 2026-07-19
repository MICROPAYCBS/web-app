'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountTimelineStepInput } from '@mifos/validation';
import { useEffect, useState } from 'react';
import { DetailSection } from '@/components/composites';
import { DateField } from '@/components/composites/date-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import {
  LOAN_ACCOUNT_AMORTIZATION_HINT,
  LOAN_ACCOUNT_EXPECTED_DISBURSEMENT_HINT,
  LOAN_ACCOUNT_EXPECTED_FIRST_REPAYMENT_HINT,
  LOAN_ACCOUNT_GRACE_ON_INTEREST_CHARGED_HINT,
  LOAN_ACCOUNT_GRACE_ON_INTEREST_PAYMENT_HINT,
  LOAN_ACCOUNT_GRACE_ON_PRINCIPAL_HINT,
  LOAN_ACCOUNT_INTEREST_CALCULATION_PERIOD_HINT,
  LOAN_ACCOUNT_INTEREST_RATE_HINT,
  LOAN_ACCOUNT_INTEREST_TYPE_HINT,
  LOAN_ACCOUNT_REPAYMENT_STRATEGY_HINT
} from '@/lib/fineract/loan-account-field-hints';
import {
  filteredLoanApplicationStrategyOptions,
  formatLoanApplicationRangeHint,
  isLoanApplicationFloatingProduct,
  joinLoanApplicationFieldDescriptions,
  loanApplicationAllowedRangeDescription,
  loanApplicationGraceOverrideLocked,
  loanApplicationHasEditableInterestSettings,
  loanApplicationInterestRateFieldLabel,
  loanApplicationInterestRatePeriodDescription,
  loanApplicationOverrideLocked,
  loanApplicationRateDifferentialFieldLabel,
  loanApplicationRateDifferentialPeriodDescription
} from '@/lib/fineract/loan-application-rules';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountTimelineStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountDraft;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountTimelineStepInput>) => void;
}) {
  const disbursementFromDate = fineractDateToDate(draft.expectedDisbursementDate);
  const floatingProduct = isLoanApplicationFloatingProduct(template);
  const overrides = template.allowAttributeOverrides;
  const graceLocked = loanApplicationGraceOverrideLocked(overrides);
  const strategyOptions = filteredLoanApplicationStrategyOptions(template);
  const interestRange = formatLoanApplicationRangeHint(
    template.minInterestRatePerPeriod,
    template.maxInterestRatePerPeriod,
    '%'
  );
  const differentialRange = formatLoanApplicationRangeHint(
    template.minInterestRateDifferential,
    template.maxInterestRateDifferential
  );
  const interestRangeDescription = joinLoanApplicationFieldDescriptions(
    loanApplicationInterestRatePeriodDescription(template),
    loanApplicationAllowedRangeDescription(interestRange)
  );
  const differentialRangeDescription = joinLoanApplicationFieldDescriptions(
    loanApplicationRateDifferentialPeriodDescription(template),
    loanApplicationAllowedRangeDescription(differentialRange)
  );
  const showCalculationSettings = loanApplicationHasEditableInterestSettings(template);
  const [interestRateText, setInterestRateText] = useState<string | null>(null);

  useEffect(() => {
    setInterestRateText(null);
  }, [draft.productId]);

  const interestRateDisplay =
    interestRateText ?? String(draft.interestRatePerPeriod ?? '');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define interest, key dates, and optional grace periods for this application.
      </p>
      <DetailSection title="Interest">
        {floatingProduct ? (
          <NumericField
            id="loan-interest-rate-differential"
            label={loanApplicationRateDifferentialFieldLabel(template)}
            required
            value={
              draft.interestRateDifferential != null && draft.interestRateDifferential >= 0
                ? String(draft.interestRateDifferential)
                : ''
            }
            onChange={(value) =>
              onChange({
                interestRateDifferential: value ? Number(value) : undefined,
                isFloatingInterestRate: true,
                interestType: 0
              })
            }
            error={errors.interestRateDifferential}
            description={differentialRangeDescription}
            hint="Adjusts the published floating rate up or down for this application."
            hintAriaLabel="About rate differential"
          />
        ) : (
          <NumericField
            id="loan-interest-rate"
            label={loanApplicationInterestRateFieldLabel(template)}
            required
            value={interestRateDisplay}
            onChange={(value) => {
              setInterestRateText(value);
              if (value !== '' && value !== '-') {
                const parsed = Number(value);
                if (!Number.isNaN(parsed)) {
                  onChange({ interestRatePerPeriod: parsed });
                }
              }
            }}
            onBlur={() => {
              const text = interestRateText ?? String(draft.interestRatePerPeriod ?? '');
              const parsed = text === '' || text === '-' ? 0 : Number(text);
              if (!Number.isNaN(parsed)) {
                onChange({ interestRatePerPeriod: parsed });
              }
              setInterestRateText(null);
            }}
            error={errors.interestRatePerPeriod}
            description={interestRangeDescription}
            hint={LOAN_ACCOUNT_INTEREST_RATE_HINT}
            hintAriaLabel="About interest rate per period"
          />
        )}
      </DetailSection>
      <DetailSection title="Application dates">
        <div className="grid gap-4 sm:grid-cols-2">
          <TransactionDateField
            id="loan-submitted-on"
            label="Submitted on"
            required
            dateFormat={FINERACT_DATE_FORMAT}
            value={draft.submittedOnDate}
            onChange={(submittedOnDate) => onChange({ submittedOnDate })}
            error={errors.submittedOnDate}
          />
          <DateField
            id="loan-expected-disbursement"
            label="Expected disbursement"
            required
            dateFormat={FINERACT_DATE_FORMAT}
            allowFuture
            value={draft.expectedDisbursementDate}
            onChange={(expectedDisbursementDate) =>
              onChange({ expectedDisbursementDate: expectedDisbursementDate ?? '' })
            }
            error={errors.expectedDisbursementDate}
            hint={LOAN_ACCOUNT_EXPECTED_DISBURSEMENT_HINT}
            hintAriaLabel="About expected disbursement"
          />
          <DateField
            id="loan-expected-first-repayment"
            label="Expected first repayment"
            optional
            dateFormat={FINERACT_DATE_FORMAT}
            allowFuture
            fromDate={disbursementFromDate}
            value={draft.repaymentsStartingFromDate}
            onChange={(repaymentsStartingFromDate) =>
              onChange({ repaymentsStartingFromDate })
            }
            error={errors.repaymentsStartingFromDate}
            hint={LOAN_ACCOUNT_EXPECTED_FIRST_REPAYMENT_HINT}
            hintAriaLabel="About expected first repayment"
          />
        </div>
      </DetailSection>
      <DetailSection title="Grace periods">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumericField
            id="grace-principal"
            label="Grace on principal"
            optional
            integer
            disabled={graceLocked}
            value={String(draft.graceOnPrincipalPayment ?? 0)}
            onChange={(value) =>
              onChange({ graceOnPrincipalPayment: value ? Number(value) : 0 })
            }
            error={errors.graceOnPrincipalPayment}
            hint={LOAN_ACCOUNT_GRACE_ON_PRINCIPAL_HINT}
            hintAriaLabel="About grace on principal"
          />
          <NumericField
            id="grace-interest-payment"
            label="Grace on interest payment"
            optional
            integer
            disabled={graceLocked}
            value={String(draft.graceOnInterestPayment ?? 0)}
            onChange={(value) =>
              onChange({ graceOnInterestPayment: value ? Number(value) : 0 })
            }
            error={errors.graceOnInterestPayment}
            hint={LOAN_ACCOUNT_GRACE_ON_INTEREST_PAYMENT_HINT}
            hintAriaLabel="About grace on interest payment"
          />
          <NumericField
            id="grace-interest-charged"
            label="Grace on interest charged"
            optional
            integer
            value={String(draft.graceOnInterestCharged ?? 0)}
            onChange={(value) =>
              onChange({ graceOnInterestCharged: value ? Number(value) : 0 })
            }
            error={errors.graceOnInterestCharged}
            hint={LOAN_ACCOUNT_GRACE_ON_INTEREST_CHARGED_HINT}
            hintAriaLabel="About grace on interest charged"
          />
        </div>
      </DetailSection>
      {showCalculationSettings ? (
        <DetailSection title="Calculation & repayment">
          <div className="grid gap-4 sm:grid-cols-2">
            {!loanApplicationOverrideLocked(overrides, 'amortizationType') ? (
              <SelectField
                label="Amortization"
                required
                value={String(draft.amortizationType)}
                onValueChange={(value) =>
                  onChange({ amortizationType: value ? Number(value) : 0 })
                }
                options={toSelectOptions(template.amortizationTypeOptions)}
                error={errors.amortizationType}
                hint={LOAN_ACCOUNT_AMORTIZATION_HINT}
                hintAriaLabel="About amortization"
              />
            ) : null}
            {!floatingProduct &&
            !loanApplicationOverrideLocked(overrides, 'interestType') ? (
              <SelectField
                label="Interest type"
                required
                value={String(draft.interestType)}
                onValueChange={(value) => onChange({ interestType: value ? Number(value) : 0 })}
                options={toSelectOptions(template.interestTypeOptions)}
                error={errors.interestType}
                hint={LOAN_ACCOUNT_INTEREST_TYPE_HINT}
                hintAriaLabel="About interest type"
              />
            ) : null}
            {!loanApplicationOverrideLocked(overrides, 'interestCalculationPeriodType') ? (
              <SelectField
                label="Interest calculation period"
                required
                value={String(draft.interestCalculationPeriodType)}
                onValueChange={(value) =>
                  onChange({ interestCalculationPeriodType: value ? Number(value) : 0 })
                }
                options={toSelectOptions(template.interestCalculationPeriodTypeOptions)}
                error={errors.interestCalculationPeriodType}
                hint={LOAN_ACCOUNT_INTEREST_CALCULATION_PERIOD_HINT}
                hintAriaLabel="About interest calculation period"
              />
            ) : null}
            {!loanApplicationOverrideLocked(overrides, 'transactionProcessingStrategyCode') ? (
              <SelectField
                label="Repayment strategy"
                required
                value={draft.transactionProcessingStrategyCode || undefined}
                onValueChange={(value) =>
                  onChange({ transactionProcessingStrategyCode: value ?? '' })
                }
                options={strategyOptions}
                placeholder="Select strategy"
                error={errors.transactionProcessingStrategyCode}
                hint={LOAN_ACCOUNT_REPAYMENT_STRATEGY_HINT}
                hintAriaLabel="About repayment strategy"
              />
            ) : null}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

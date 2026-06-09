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
import { DetailSection } from '@/components/composites';
import { DateField } from '@/components/composites/date-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountTimelineStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountTimelineStepInput;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountTimelineStepInput>) => void;
}) {
  const strategyOptions = (template.transactionProcessingStrategyOptions ?? []).map(
    (option) => ({
      value: option.code ?? '',
      label: option.name ?? option.code ?? 'Strategy',
      keywords: [option.name ?? '', option.code ?? '']
    })
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define interest, key dates, and optional grace periods for this application.
      </p>
      <DetailSection title="Interest">
        <NumericField
          id="loan-interest-rate"
          label="Interest rate per period (%)"
          required
          value={
            draft.interestRatePerPeriod >= 0 ? String(draft.interestRatePerPeriod) : ''
          }
          onChange={(value) =>
            onChange({ interestRatePerPeriod: value ? Number(value) : 0 })
          }
          error={errors.interestRatePerPeriod}
        />
      </DetailSection>
      <DetailSection title="Application dates">
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="loan-submitted-on"
            label="Submitted on"
            required
            dateFormat={FINERACT_DATE_FORMAT}
            value={draft.submittedOnDate}
            onChange={(submittedOnDate) => onChange({ submittedOnDate: submittedOnDate ?? '' })}
            error={errors.submittedOnDate}
          />
          <DateField
            id="loan-expected-disbursement"
            label="Expected disbursement"
            required
            dateFormat={FINERACT_DATE_FORMAT}
            value={draft.expectedDisbursementDate}
            onChange={(expectedDisbursementDate) =>
              onChange({ expectedDisbursementDate: expectedDisbursementDate ?? '' })
            }
            error={errors.expectedDisbursementDate}
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
            value={String(draft.graceOnPrincipalPayment ?? 0)}
            onChange={(value) =>
              onChange({ graceOnPrincipalPayment: value ? Number(value) : 0 })
            }
            error={errors.graceOnPrincipalPayment}
          />
          <NumericField
            id="grace-interest-payment"
            label="Grace on interest payment"
            optional
            integer
            value={String(draft.graceOnInterestPayment ?? 0)}
            onChange={(value) =>
              onChange({ graceOnInterestPayment: value ? Number(value) : 0 })
            }
            error={errors.graceOnInterestPayment}
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
          />
        </div>
      </DetailSection>
      <DetailSection title="Product settings">
        <p className="mb-4 text-sm text-muted-foreground">
          These values are inherited from the loan product. Adjust only when the product allows
          overrides.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Amortization"
            required
            value={String(draft.amortizationType)}
            onValueChange={(value) =>
              onChange({ amortizationType: value ? Number(value) : 0 })
            }
            options={toSelectOptions(template.amortizationTypeOptions)}
            error={errors.amortizationType}
          />
          <SelectField
            label="Interest type"
            required
            value={String(draft.interestType)}
            onValueChange={(value) => onChange({ interestType: value ? Number(value) : 0 })}
            options={toSelectOptions(template.interestTypeOptions)}
            error={errors.interestType}
          />
          <SelectField
            label="Interest calculation period"
            required
            value={String(draft.interestCalculationPeriodType)}
            onValueChange={(value) =>
              onChange({ interestCalculationPeriodType: value ? Number(value) : 0 })
            }
            options={toSelectOptions(template.interestCalculationPeriodTypeOptions)}
            error={errors.interestCalculationPeriodType}
          />
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
          />
        </div>
      </DetailSection>
    </div>
  );
}

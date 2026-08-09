'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductTermsInput } from '@mifos/validation';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { SavingsProductStepProps } from '../types';

export function TermsStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductTermsInput>) => void;
}) {
  const terms = draft.terms;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Interest rate and calculation rules for this deposit product.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumericField
          id="terms.nominalAnnualInterestRate"
          label="Nominal annual interest rate"
          required
          value={String(terms.nominalAnnualInterestRate ?? '')}
          onChange={(value) =>
            onChange({
              nominalAnnualInterestRate: value === '' ? undefined : Number(value)
            })
          }
          error={errors['terms.nominalAnnualInterestRate']}
        />
        <SelectField
          id="terms.interestCompoundingPeriodType"
          label="Interest compounding period"
          required
          value={
            terms.interestCompoundingPeriodType != null
              ? String(terms.interestCompoundingPeriodType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({ interestCompoundingPeriodType: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.interestCompoundingPeriodTypeOptions)}
          error={errors['terms.interestCompoundingPeriodType']}
        />
        <SelectField
          id="terms.interestPostingPeriodType"
          label="Interest posting period"
          required
          value={
            terms.interestPostingPeriodType != null
              ? String(terms.interestPostingPeriodType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({ interestPostingPeriodType: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.interestPostingPeriodTypeOptions)}
          error={errors['terms.interestPostingPeriodType']}
        />
        <SelectField
          id="terms.interestCalculationType"
          label="Interest calculation"
          required
          value={
            terms.interestCalculationType != null
              ? String(terms.interestCalculationType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({ interestCalculationType: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.interestCalculationTypeOptions)}
          error={errors['terms.interestCalculationType']}
        />
        <SelectField
          id="terms.interestCalculationDaysInYearType"
          label="Days in year"
          required
          value={
            terms.interestCalculationDaysInYearType != null
              ? String(terms.interestCalculationDaysInYearType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({ interestCalculationDaysInYearType: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.interestCalculationDaysInYearTypeOptions)}
          error={errors['terms.interestCalculationDaysInYearType']}
        />
      </div>
    </div>
  );
}

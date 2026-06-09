'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductTermsInput } from '@mifos/validation';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { DepositProductStepProps } from '../types';

export function TermsStep({
  template,
  draft,
  errors,
  onChange
}: DepositProductStepProps & {
  onChange: (patch: Partial<DepositProductTermsInput>) => void;
}) {
  const terms = draft.terms;
  const currencyCode = draft.currency.currencyCode || undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Deposit amounts and interest calculation rules. Interest rates are defined on the interest
        rate chart step.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField
          id="terms.minDepositAmount"
          label="Minimum deposit amount"
          optional
          currencyCode={currencyCode}
          value={terms.minDepositAmount != null ? String(terms.minDepositAmount) : ''}
          onChange={(value) =>
            onChange({ minDepositAmount: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.minDepositAmount']}
        />
        <MoneyField
          id="terms.depositAmount"
          label="Default deposit amount"
          required
          currencyCode={currencyCode}
          value={terms.depositAmount != null ? String(terms.depositAmount) : ''}
          onChange={(value) =>
            onChange({ depositAmount: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.depositAmount']}
        />
        <MoneyField
          id="terms.maxDepositAmount"
          label="Maximum deposit amount"
          optional
          currencyCode={currencyCode}
          value={terms.maxDepositAmount != null ? String(terms.maxDepositAmount) : ''}
          onChange={(value) =>
            onChange({ maxDepositAmount: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.maxDepositAmount']}
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
            onChange({
              interestCalculationDaysInYearType: value ? Number(value) : undefined
            })
          }
          options={toSelectOptions(template.interestCalculationDaysInYearTypeOptions)}
          error={errors['terms.interestCalculationDaysInYearType']}
        />
      </div>
    </div>
  );
}

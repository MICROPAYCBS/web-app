'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountFinancialStepInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountFinancialStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountFinancialStepInput;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountFinancialStepInput>) => void;
}) {
  const currencyCode = template.currency?.code ?? 'USD';

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set the principal amount, tenure, and installment schedule. Defaults come from the
        selected product when available.
      </p>
      <DetailSection title="Principal">
        <MoneyField
          id="loan-principal"
          label="Principal"
          required
          currencyCode={currencyCode}
          value={draft.principal > 0 ? String(draft.principal) : ''}
          onChange={(value) => onChange({ principal: value ? Number(value) : 0 })}
          error={errors.principal}
        />
      </DetailSection>
      <DetailSection title="Loan term">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="loan-term-frequency"
            label="Loan term"
            required
            integer
            value={draft.loanTermFrequency > 0 ? String(draft.loanTermFrequency) : ''}
            onChange={(value) =>
              onChange({ loanTermFrequency: value ? Number(value) : 0 })
            }
            error={errors.loanTermFrequency}
          />
          <SelectField
            label="Loan term type"
            required
            value={String(draft.loanTermFrequencyType)}
            onValueChange={(value) =>
              onChange({ loanTermFrequencyType: value ? Number(value) : 0 })
            }
            options={toSelectOptions(template.termFrequencyTypeOptions)}
            error={errors.loanTermFrequencyType}
          />
        </div>
      </DetailSection>
      <DetailSection title="Repayment schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="loan-repayments"
            label="Number of repayments"
            required
            integer
            value={draft.numberOfRepayments > 0 ? String(draft.numberOfRepayments) : ''}
            onChange={(value) =>
              onChange({ numberOfRepayments: value ? Number(value) : 0 })
            }
            error={errors.numberOfRepayments}
          />
          <NumericField
            id="loan-repayment-every"
            label="Repay every"
            required
            integer
            value={draft.repaymentEvery > 0 ? String(draft.repaymentEvery) : ''}
            onChange={(value) => onChange({ repaymentEvery: value ? Number(value) : 0 })}
            error={errors.repaymentEvery}
          />
          <SelectField
            label="Repayment frequency type"
            required
            value={String(draft.repaymentFrequencyType)}
            onValueChange={(value) =>
              onChange({ repaymentFrequencyType: value ? Number(value) : 0 })
            }
            options={toSelectOptions(template.repaymentFrequencyTypeOptions)}
            error={errors.repaymentFrequencyType}
          />
        </div>
      </DetailSection>
    </div>
  );
}

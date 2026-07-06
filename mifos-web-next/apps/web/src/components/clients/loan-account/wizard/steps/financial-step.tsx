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
import {
  hasLoanAccountProductTermsInfo,
  LoanAccountProductTermsSummary
} from '@/components/clients/loan-account/loan-account-product-terms-summary';
import { DetailSection } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LOAN_ACCOUNT_LOAN_TERM_HINT,
  LOAN_ACCOUNT_LOAN_TERM_TYPE_HINT,
  LOAN_ACCOUNT_NUMBER_OF_REPAYMENTS_HINT,
  LOAN_ACCOUNT_PRINCIPAL_HINT,
  LOAN_ACCOUNT_REPAY_EVERY_HINT,
  LOAN_ACCOUNT_REPAYMENT_FREQUENCY_TYPE_HINT
} from '@/lib/fineract/loan-account-field-hints';
import {
  formatLoanApplicationMoneyRangeHint,
  formatLoanApplicationRangeHint,
  loanApplicationAllowedRangeDescription,
  loanApplicationOverrideLocked,
  syncLoanTermFromRepayments,
  syncRepaymentsFromLoanTerm
} from '@/lib/fineract/loan-application-rules';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

function LoanAccountFinancialTermsForm({
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
  const overrides = template.allowAttributeOverrides;
  const repaymentLocked = loanApplicationOverrideLocked(overrides, 'repaymentEvery');
  const principalRange = formatLoanApplicationMoneyRangeHint(
    template.minPrincipal,
    template.maxPrincipal,
    currencyCode
  );
  const repaymentRange = formatLoanApplicationRangeHint(
    template.minNumberOfRepayments,
    template.maxNumberOfRepayments
  );

  const applyRepaymentCountPatch = (patch: Partial<LoanAccountFinancialStepInput>) => {
    const next = { ...draft, ...patch };
    onChange({ ...patch, ...syncLoanTermFromRepayments(next) });
  };

  const applyRepaymentIntervalPatch = (patch: Partial<LoanAccountFinancialStepInput>) => {
    const next = { ...draft, ...patch };
    onChange({ ...patch, ...syncRepaymentsFromLoanTerm(next) });
  };

  const applyLoanTermPatch = (patch: Partial<LoanAccountFinancialStepInput>) => {
    const next = { ...draft, ...patch };
    onChange({ ...patch, ...syncRepaymentsFromLoanTerm(next) });
  };

  const principalHint = LOAN_ACCOUNT_PRINCIPAL_HINT;
  const repaymentHint = LOAN_ACCOUNT_NUMBER_OF_REPAYMENTS_HINT;
  const principalRangeDescription = loanApplicationAllowedRangeDescription(principalRange);
  const repaymentRangeDescription = loanApplicationAllowedRangeDescription(repaymentRange);

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Start with how long the loan runs, then how often installments fall due. When units
        match, repayments are derived from loan term ÷ repay every (e.g. 12 months ÷ every 1
        month → 12 repayments).
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
          description={principalRangeDescription}
          hint={principalHint}
          hintAriaLabel="About principal"
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
              applyLoanTermPatch({ loanTermFrequency: value ? Number(value) : 0 })
            }
            error={errors.loanTermFrequency}
            hint={`${LOAN_ACCOUNT_LOAN_TERM_HINT} Drives the number of repayments when units match.`}
            hintAriaLabel="About loan term"
          />
          <SelectField
            label="Term unit"
            required
            value={String(draft.loanTermFrequencyType)}
            onValueChange={(value) =>
              applyLoanTermPatch({
                loanTermFrequencyType: value ? Number(value) : 0
              })
            }
            options={toSelectOptions(template.termFrequencyTypeOptions)}
            error={errors.loanTermFrequencyType}
            hint={LOAN_ACCOUNT_LOAN_TERM_TYPE_HINT}
            hintAriaLabel="About term unit"
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
              applyRepaymentCountPatch({ numberOfRepayments: value ? Number(value) : 0 })
            }
            error={errors.numberOfRepayments}
            description={repaymentRangeDescription}
            hint={`${repaymentHint} Auto-calculated from loan term when units match.`}
            hintAriaLabel="About number of repayments"
          />
          <NumericField
            id="loan-repayment-every"
            label="Repay every"
            required
            integer
            disabled={repaymentLocked}
            value={draft.repaymentEvery > 0 ? String(draft.repaymentEvery) : ''}
            onChange={(value) =>
              applyRepaymentIntervalPatch({ repaymentEvery: value ? Number(value) : 0 })
            }
            error={errors.repaymentEvery}
            hint={
              repaymentLocked ? undefined : LOAN_ACCOUNT_REPAY_EVERY_HINT
            }
            hintAriaLabel="About repay every"
          />
          <SelectField
            label="Repayment interval unit"
            required
            disabled={repaymentLocked}
            value={String(draft.repaymentFrequencyType)}
            onValueChange={(value) =>
              applyRepaymentIntervalPatch({
                repaymentFrequencyType: value ? Number(value) : 0
              })
            }
            options={toSelectOptions(template.repaymentFrequencyTypeOptions)}
            error={errors.repaymentFrequencyType}
            hint={
              repaymentLocked ? undefined : LOAN_ACCOUNT_REPAYMENT_FREQUENCY_TYPE_HINT
            }
            hintAriaLabel="About repayment interval unit"
          />
        </div>
      </DetailSection>
    </div>
  );
}

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
  const showProductDefaults = hasLoanAccountProductTermsInfo(template);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set the principal amount, loan duration, and installment schedule for this application.
      </p>

      {showProductDefaults ? (
        <Tabs defaultValue="application" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="application">Application terms</TabsTrigger>
            <TabsTrigger value="defaults">Product defaults</TabsTrigger>
          </TabsList>
          <TabsContent value="application" className="mt-0">
            <LoanAccountFinancialTermsForm
              template={template}
              draft={draft}
              errors={errors}
              onChange={onChange}
            />
          </TabsContent>
          <TabsContent value="defaults" className="mt-0">
            <LoanAccountProductTermsSummary template={template} variant="embedded" />
          </TabsContent>
        </Tabs>
      ) : (
        <LoanAccountFinancialTermsForm
          template={template}
          draft={draft}
          errors={errors}
          onChange={onChange}
        />
      )}
    </div>
  );
}

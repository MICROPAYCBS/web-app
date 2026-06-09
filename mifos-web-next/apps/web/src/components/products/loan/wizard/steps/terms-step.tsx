'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductTermsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { LOAN_PRODUCT_NOMINAL_INTEREST_RATE_HINT } from '@/lib/fineract/loan-product-field-hints';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanProductStepProps } from '../types';

export function TermsStep({
  template,
  draft,
  errors,
  onChange
}: LoanProductStepProps & {
  onChange: (patch: Partial<LoanProductTermsInput>) => void;
}) {
  const terms = draft.terms;
  const currencyCode = draft.currency.currencyCode || undefined;
  const floating = terms.isLinkedToFloatingInterestRates ?? false;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Principal, repayment schedule, and interest terms for new loan accounts.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SwitchField
          id="terms.isLinkedToFloatingInterestRates"
          label="Link to floating interest rates"
          checked={floating}
          onCheckedChange={(isLinkedToFloatingInterestRates) => {
            if (isLinkedToFloatingInterestRates) {
              onChange({
                isLinkedToFloatingInterestRates: true,
                interestRatePerPeriod: undefined,
                minInterestRatePerPeriod: undefined,
                maxInterestRatePerPeriod: undefined,
                interestRateFrequencyType: undefined
              });
              return;
            }
            onChange({
              isLinkedToFloatingInterestRates: false,
              floatingRatesId: undefined,
              defaultDifferentialLendingRate: undefined,
              minDifferentialLendingRate: undefined,
              maxDifferentialLendingRate: undefined,
              isFloatingInterestRateCalculationAllowed: undefined
            });
          }}
          error={errors['terms.isLinkedToFloatingInterestRates']}
        />

        {floating ? (
          <>
            <SelectField
              id="terms.floatingRatesId"
              label="Floating rate"
              required
              value={terms.floatingRatesId ? String(terms.floatingRatesId) : undefined}
              onValueChange={(value) =>
                onChange({ floatingRatesId: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.floatingRateOptions)}
              error={errors['terms.floatingRatesId']}
            />
            <NumericField
              id="terms.defaultDifferentialLendingRate"
              label="Default differential lending rate"
              required
              value={
                terms.defaultDifferentialLendingRate != null
                  ? String(terms.defaultDifferentialLendingRate)
                  : ''
              }
              onChange={(value) =>
                onChange({
                  defaultDifferentialLendingRate: value === '' ? undefined : Number(value)
                })
              }
              error={errors['terms.defaultDifferentialLendingRate']}
            />
            <NumericField
              id="terms.minDifferentialLendingRate"
              label="Min differential rate"
              optional
              value={
                terms.minDifferentialLendingRate != null
                  ? String(terms.minDifferentialLendingRate)
                  : ''
              }
              onChange={(value) =>
                onChange({
                  minDifferentialLendingRate: value === '' ? undefined : Number(value)
                })
              }
              error={errors['terms.minDifferentialLendingRate']}
            />
            <NumericField
              id="terms.maxDifferentialLendingRate"
              label="Max differential rate"
              optional
              value={
                terms.maxDifferentialLendingRate != null
                  ? String(terms.maxDifferentialLendingRate)
                  : ''
              }
              onChange={(value) =>
                onChange({
                  maxDifferentialLendingRate: value === '' ? undefined : Number(value)
                })
              }
              error={errors['terms.maxDifferentialLendingRate']}
            />
            <SwitchField
              id="terms.isFloatingInterestRateCalculationAllowed"
              label="Allow floating interest rate calculation"
              checked={terms.isFloatingInterestRateCalculationAllowed ?? false}
              onCheckedChange={(isFloatingInterestRateCalculationAllowed) =>
                onChange({ isFloatingInterestRateCalculationAllowed })
              }
              error={errors['terms.isFloatingInterestRateCalculationAllowed']}
            />
          </>
        ) : (
          <div className="sm:col-span-2">
            <DetailSection title="Nominal interest rate">
              <div className="grid gap-4 sm:grid-cols-2">
              <NumericField
                id="terms.minInterestRatePerPeriod"
                label="Minimum interest rate"
                optional
                maxDecimalPlaces={6}
                value={
                  terms.minInterestRatePerPeriod != null
                    ? String(terms.minInterestRatePerPeriod)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    minInterestRatePerPeriod: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['terms.minInterestRatePerPeriod']}
              />
              <NumericField
                id="terms.interestRatePerPeriod"
                label="Default interest rate"
                required
                maxDecimalPlaces={6}
                hint={LOAN_PRODUCT_NOMINAL_INTEREST_RATE_HINT}
                hintAriaLabel="About nominal interest rate"
                value={
                  terms.interestRatePerPeriod != null ? String(terms.interestRatePerPeriod) : ''
                }
                onChange={(value) =>
                  onChange({
                    interestRatePerPeriod: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['terms.interestRatePerPeriod']}
              />
              <NumericField
                id="terms.maxInterestRatePerPeriod"
                label="Maximum interest rate"
                optional
                maxDecimalPlaces={6}
                value={
                  terms.maxInterestRatePerPeriod != null
                    ? String(terms.maxInterestRatePerPeriod)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    maxInterestRatePerPeriod: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['terms.maxInterestRatePerPeriod']}
              />
              <SelectField
                id="terms.interestRateFrequencyType"
                label="Interest rate frequency"
                required
                value={
                  terms.interestRateFrequencyType != null
                    ? String(terms.interestRateFrequencyType)
                    : undefined
                }
                onValueChange={(value) =>
                  onChange({
                    interestRateFrequencyType: value ? Number(value) : undefined
                  })
                }
                options={toSelectOptions(template.interestRateFrequencyTypeOptions)}
                error={errors['terms.interestRateFrequencyType']}
              />
            </div>
            </DetailSection>
          </div>
        )}

        <MoneyField
          id="terms.principal"
          label="Default principal"
          required
          currencyCode={currencyCode}
          value={terms.principal != null ? String(terms.principal) : ''}
          onChange={(value) =>
            onChange({ principal: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.principal']}
        />
        <MoneyField
          id="terms.minPrincipal"
          label="Minimum principal"
          optional
          currencyCode={currencyCode}
          value={terms.minPrincipal != null ? String(terms.minPrincipal) : ''}
          onChange={(value) =>
            onChange({ minPrincipal: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.minPrincipal']}
        />
        <MoneyField
          id="terms.maxPrincipal"
          label="Maximum principal"
          optional
          currencyCode={currencyCode}
          value={terms.maxPrincipal != null ? String(terms.maxPrincipal) : ''}
          onChange={(value) =>
            onChange({ maxPrincipal: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.maxPrincipal']}
        />
        <NumericField
          id="terms.numberOfRepayments"
          label="Number of repayments"
          required
          integer
          value={terms.numberOfRepayments != null ? String(terms.numberOfRepayments) : ''}
          onChange={(value) =>
            onChange({ numberOfRepayments: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.numberOfRepayments']}
        />
        <NumericField
          id="terms.minNumberOfRepayments"
          label="Minimum repayments"
          optional
          integer
          value={
            terms.minNumberOfRepayments != null ? String(terms.minNumberOfRepayments) : ''
          }
          onChange={(value) =>
            onChange({ minNumberOfRepayments: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.minNumberOfRepayments']}
        />
        <NumericField
          id="terms.maxNumberOfRepayments"
          label="Maximum repayments"
          optional
          integer
          value={
            terms.maxNumberOfRepayments != null ? String(terms.maxNumberOfRepayments) : ''
          }
          onChange={(value) =>
            onChange({ maxNumberOfRepayments: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.maxNumberOfRepayments']}
        />
        <NumericField
          id="terms.repaymentEvery"
          label="Repay every"
          required
          integer
          value={terms.repaymentEvery != null ? String(terms.repaymentEvery) : ''}
          onChange={(value) =>
            onChange({ repaymentEvery: value === '' ? undefined : Number(value) })
          }
          error={errors['terms.repaymentEvery']}
        />
        <SelectField
          id="terms.repaymentFrequencyType"
          label="Repayment frequency type"
          required
          value={
            terms.repaymentFrequencyType != null
              ? String(terms.repaymentFrequencyType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({ repaymentFrequencyType: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.repaymentFrequencyTypeOptions)}
          error={errors['terms.repaymentFrequencyType']}
        />
        {template.repaymentStartDateTypeOptions?.length ? (
          <SelectField
            id="terms.repaymentStartDateType"
            label="Repayment start date type"
            optional
            value={
              terms.repaymentStartDateType != null
                ? String(terms.repaymentStartDateType)
                : undefined
            }
            onValueChange={(value) =>
              onChange({ repaymentStartDateType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.repaymentStartDateTypeOptions)}
            error={errors['terms.repaymentStartDateType']}
          />
        ) : null}
      </div>
    </div>
  );
}

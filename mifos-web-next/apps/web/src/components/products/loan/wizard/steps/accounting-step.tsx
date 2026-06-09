'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductAccountingInput } from '@mifos/validation';
import type { LoanProductGlAccountOption } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { accountingRuleLabel } from '@/lib/fineract/product-display';
import { cn } from '@/lib/utils';
import type { LoanProductStepProps } from '../types';

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: account.glCode && account.name ? `${account.glCode} — ${account.name}` : (account.name ?? account.glCode ?? `Account ${account.id}`)
  }));
}

const CORE_ACCOUNT_FIELDS: {
  key: keyof LoanProductAccountingInput;
  label: string;
  optionKey: keyof NonNullable<LoanProductStepProps['template']['accountingMappingOptions']>;
}[] = [
  { key: 'fundSourceAccountId', label: 'Fund source', optionKey: 'assetAccountOptions' },
  { key: 'loanPortfolioAccountId', label: 'Loan portfolio', optionKey: 'assetAccountOptions' },
  {
    key: 'transfersInSuspenseAccountId',
    label: 'Transfer in suspense',
    optionKey: 'assetAccountOptions'
  },
  { key: 'interestOnLoanAccountId', label: 'Income from interest', optionKey: 'incomeAccountOptions' },
  { key: 'incomeFromFeeAccountId', label: 'Income from fees', optionKey: 'incomeAccountOptions' },
  {
    key: 'incomeFromPenaltyAccountId',
    label: 'Income from penalties',
    optionKey: 'incomeAccountOptions'
  },
  {
    key: 'incomeFromRecoveryAccountId',
    label: 'Income from recovery',
    optionKey: 'incomeAccountOptions'
  },
  { key: 'writeOffAccountId', label: 'Losses written off', optionKey: 'expenseAccountOptions' },
  {
    key: 'overpaymentLiabilityAccountId',
    label: 'Overpayment liability',
    optionKey: 'liabilityAccountOptions'
  }
];

const ACCRUAL_ACCOUNT_FIELDS: {
  key: keyof LoanProductAccountingInput;
  label: string;
}[] = [
  { key: 'receivableInterestAccountId', label: 'Interest receivable' },
  { key: 'receivableFeeAccountId', label: 'Fees receivable' },
  { key: 'receivablePenaltyAccountId', label: 'Penalties receivable' }
];

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: LoanProductStepProps & {
  onChange: (patch: Partial<LoanProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = accounting.accountingRule ?? 1;
  const accountingEnabled = rule !== 1;
  const accrualEnabled = rule === 3 || rule === 4;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const assetOptions = glOptions(mappingOptions.assetAccountOptions);

  function setAccountField(
    key: keyof LoanProductAccountingInput,
    value: string | undefined
  ) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<LoanProductAccountingInput>);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how loan transactions are posted to the general ledger.
      </p>

      <DetailSection title="Accounting rule">
        <fieldset className="space-y-2">
          <legend className="sr-only">Accounting rule</legend>
          {(template.accountingRuleOptions ?? []).map((option) => {
            const id = option.id ?? 0;
            const selected = rule === id;
            return (
              <label
                key={id}
                htmlFor={`accounting-rule-${id}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/40'
                )}
              >
                <input
                  id={`accounting-rule-${id}`}
                  type="radio"
                  name="accountingRule"
                  className="size-4 shrink-0 accent-primary"
                  checked={selected}
                  onChange={() => {
                    const patch: Partial<LoanProductAccountingInput> = { accountingRule: id };
                    if (id !== 3 && id !== 4) {
                      patch.enableAccrualActivityPosting = undefined;
                    }
                    onChange(patch);
                  }}
                />
                <span>{accountingRuleLabel(option)}</span>
              </label>
            );
          })}
        </fieldset>
        {errors['accounting.accountingRule'] ? (
          <p className="mt-2 text-sm text-destructive">{errors['accounting.accountingRule']}</p>
        ) : null}
      </DetailSection>

      {accountingEnabled ? (
        <>
          <DetailSection title="Core accounts">
            <div className="grid gap-4 sm:grid-cols-2">
              {CORE_ACCOUNT_FIELDS.map((field) => {
                const options =
                  field.optionKey === 'assetAccountOptions'
                    ? assetOptions
                    : glOptions(mappingOptions[field.optionKey]);
                const value = accounting[field.key];
                return (
                  <SelectField
                    key={field.key}
                    id={`accounting.${field.key}`}
                    label={field.label}
                    required
                    value={value != null ? String(value) : undefined}
                    onValueChange={(next) => setAccountField(field.key, next)}
                    options={options}
                    error={errors[`accounting.${field.key}`]}
                  />
                );
              })}
              {accrualEnabled
                ? ACCRUAL_ACCOUNT_FIELDS.map((field) => {
                    const value = accounting[field.key];
                    return (
                      <SelectField
                        key={field.key}
                        id={`accounting.${field.key}`}
                        label={field.label}
                        required
                        value={value != null ? String(value) : undefined}
                        onValueChange={(next) => setAccountField(field.key, next)}
                        options={assetOptions}
                        error={errors[`accounting.${field.key}`]}
                      />
                    );
                  })
                : null}
              {accrualEnabled ? (
                <SwitchField
                  id="accounting.enableAccrualActivityPosting"
                  label="Accrual activity posting on due date"
                  checked={accounting.enableAccrualActivityPosting ?? false}
                  onCheckedChange={(enableAccrualActivityPosting) =>
                    onChange({ enableAccrualActivityPosting })
                  }
                  error={errors['accounting.enableAccrualActivityPosting']}
                />
              ) : null}
            </div>
          </DetailSection>
        </>
      ) : null}
    </div>
  );
}

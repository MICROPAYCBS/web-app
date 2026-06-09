'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductAccountingInput } from '@mifos/validation';
import type { LoanProductGlAccountOption } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { cn } from '@/lib/utils';
import type { SavingsProductStepProps } from '../types';

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const CORE_ACCOUNT_FIELDS: {
  key: keyof SavingsProductAccountingInput;
  label: string;
  optionKey: keyof NonNullable<SavingsProductStepProps['template']['accountingMappingOptions']>;
}[] = [
  { key: 'savingsReferenceAccountId', label: 'Saving reference', optionKey: 'assetAccountOptions' },
  {
    key: 'overdraftPortfolioControlId',
    label: 'Overdraft portfolio control',
    optionKey: 'assetAccountOptions'
  },
  { key: 'savingsControlAccountId', label: 'Saving control', optionKey: 'assetAccountOptions' },
  {
    key: 'transfersInSuspenseAccountId',
    label: 'Transfer in suspense',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'interestOnSavingsAccountId',
    label: 'Interest on savings',
    optionKey: 'expenseAccountOptions'
  },
  { key: 'writeOffAccountId', label: 'Losses written off', optionKey: 'expenseAccountOptions' },
  { key: 'incomeFromFeeAccountId', label: 'Income from fees', optionKey: 'incomeAccountOptions' },
  {
    key: 'incomeFromPenaltyAccountId',
    label: 'Income from penalties',
    optionKey: 'incomeAccountOptions'
  },
  { key: 'incomeFromInterestId', label: 'Income from interest', optionKey: 'incomeAccountOptions' }
];

const ACCRUAL_ACCOUNT_FIELDS: {
  key: keyof SavingsProductAccountingInput;
  label: string;
  optionKey: keyof NonNullable<SavingsProductStepProps['template']['accountingMappingOptions']>;
}[] = [
  { key: 'feesReceivableAccountId', label: 'Fees receivable', optionKey: 'assetAccountOptions' },
  {
    key: 'penaltiesReceivableAccountId',
    label: 'Penalties receivable',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'interestPayableAccountId',
    label: 'Interest payable',
    optionKey: 'liabilityAccountOptions'
  }
];

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = accounting.accountingRule ?? 1;
  const accountingEnabled = rule !== 1;
  const accrualEnabled = rule === 3;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const dormancyEnabled = draft.settings.isDormancyTrackingActive ?? false;
  const overdraftEnabled = draft.settings.allowOverdraft ?? false;

  function setAccountField(
    key: keyof SavingsProductAccountingInput,
    value: string | undefined
  ) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<SavingsProductAccountingInput>);
  }

  function setRule(id: number) {
    const patch: Partial<SavingsProductAccountingInput> = { accountingRule: id };
    if (id === 1) {
      patch.savingsReferenceAccountId = undefined;
      patch.overdraftPortfolioControlId = undefined;
      patch.savingsControlAccountId = undefined;
      patch.transfersInSuspenseAccountId = undefined;
      patch.interestOnSavingsAccountId = undefined;
      patch.writeOffAccountId = undefined;
      patch.incomeFromFeeAccountId = undefined;
      patch.incomeFromPenaltyAccountId = undefined;
      patch.incomeFromInterestId = undefined;
      patch.feesReceivableAccountId = undefined;
      patch.penaltiesReceivableAccountId = undefined;
      patch.interestReceivableAccountId = undefined;
      patch.interestPayableAccountId = undefined;
      patch.escheatLiabilityId = undefined;
    } else if (id === 2) {
      patch.feesReceivableAccountId = undefined;
      patch.penaltiesReceivableAccountId = undefined;
      patch.interestReceivableAccountId = undefined;
      patch.interestPayableAccountId = undefined;
    }
    onChange(patch);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how savings transactions are posted to the general ledger.
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
                  onChange={() => setRule(id)}
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
                const options = glOptions(mappingOptions[field.optionKey]);
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
                    const options = glOptions(mappingOptions[field.optionKey]);
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
                  })
                : null}
              {accrualEnabled && overdraftEnabled ? (
                <SelectField
                  id="accounting.interestReceivableAccountId"
                  label="Interest receivable"
                  optional
                  value={
                    accounting.interestReceivableAccountId != null
                      ? String(accounting.interestReceivableAccountId)
                      : undefined
                  }
                  onValueChange={(next) => setAccountField('interestReceivableAccountId', next)}
                  options={glOptions(mappingOptions.assetAccountOptions)}
                  error={errors['accounting.interestReceivableAccountId']}
                />
              ) : null}
              {dormancyEnabled ? (
                <SelectField
                  id="accounting.escheatLiabilityId"
                  label="Escheat liability"
                  required
                  value={
                    accounting.escheatLiabilityId != null
                      ? String(accounting.escheatLiabilityId)
                      : undefined
                  }
                  onValueChange={(next) => setAccountField('escheatLiabilityId', next)}
                  options={glOptions(mappingOptions.liabilityAccountOptions)}
                  error={errors['accounting.escheatLiabilityId']}
                />
              ) : null}
            </div>
          </DetailSection>
        </>
      ) : null}
    </div>
  );
}

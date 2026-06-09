'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductAccountingInput } from '@mifos/validation';
import type { LoanProductGlAccountOption } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { MappingSection } from '@/components/products/loan/wizard/steps/mapping-section';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  formatProductChargeOptionLabel,
  type ChargeAmountLike
} from '@/lib/fineract/charge-display';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { cn } from '@/lib/utils';
import type { DepositProductStepProps } from '../types';

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const CORE_ACCOUNT_FIELDS: {
  key: keyof DepositProductAccountingInput;
  label: string;
  optionKey: keyof NonNullable<DepositProductStepProps['template']['accountingMappingOptions']>;
}[] = [
  { key: 'savingsReferenceAccountId', label: 'Saving reference', optionKey: 'assetAccountOptions' },
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
  { key: 'incomeFromFeeAccountId', label: 'Income from fees', optionKey: 'incomeAccountOptions' },
  {
    key: 'incomeFromPenaltyAccountId',
    label: 'Income from penalties',
    optionKey: 'incomeAccountOptions'
  }
];

const ACCRUAL_ACCOUNT_FIELDS: typeof CORE_ACCOUNT_FIELDS = [
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

function allGlOptions(
  mappingOptions: DepositProductStepProps['template']['accountingMappingOptions']
) {
  const combined = [
    ...(mappingOptions?.assetAccountOptions ?? []),
    ...(mappingOptions?.incomeAccountOptions ?? []),
    ...(mappingOptions?.expenseAccountOptions ?? []),
    ...(mappingOptions?.liabilityAccountOptions ?? [])
  ];
  return glOptions(combined);
}

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: DepositProductStepProps & {
  onChange: (patch: Partial<DepositProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = accounting.accountingRule ?? 1;
  const accountingEnabled = rule !== 1;
  const isAccrual = rule === 3;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const ruleOptions = template.accountingRuleOptions?.length
    ? template.accountingRuleOptions
    : [
        { id: 1, value: 'None', code: 'NONE' },
        { id: 2, value: 'Cash', code: 'CASH' },
        { id: 3, value: 'Accrual (periodic)', code: 'ACCRUAL_PERIODIC' }
      ];

  function setAccountField(key: keyof DepositProductAccountingInput, value: string | undefined) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<DepositProductAccountingInput>);
  }

  function setRule(id: number) {
    const patch: Partial<DepositProductAccountingInput> = { accountingRule: id };
    if (id === 1) {
      for (const { key } of [...CORE_ACCOUNT_FIELDS, ...ACCRUAL_ACCOUNT_FIELDS]) {
        (patch as Record<string, undefined>)[key] = undefined;
      }
    } else if (id === 2) {
      for (const { key } of ACCRUAL_ACCOUNT_FIELDS) {
        (patch as Record<string, undefined>)[key] = undefined;
      }
    }
    onChange(patch);
  }

  const combinedGlOptions = allGlOptions(mappingOptions);
  const incomeOptions = glOptions(mappingOptions.incomeAccountOptions);
  const selectedChargeIds = draft.charges.chargeIds ?? [];
  const currencyCode = draft.currency.currencyCode?.trim().toUpperCase();
  const feeOptions =
    selectedChargeIds.length > 0
      ? (template.chargeOptions ?? [])
          .filter((option) => Number.isFinite(option.id) && selectedChargeIds.includes(option.id))
          .map((option) => ({
            value: String(option.id),
            label: formatProductChargeOptionLabel(option as ChargeAmountLike, currencyCode)
          }))
      : toSelectOptions(template.chargeOptions);
  const penaltyOptions =
    selectedChargeIds.length > 0
      ? (template.penaltyOptions ?? [])
          .filter((option) => Number.isFinite(option.id) && selectedChargeIds.includes(option.id))
          .map((option) => ({
            value: String(option.id),
            label: formatProductChargeOptionLabel(option as ChargeAmountLike, currencyCode)
          }))
      : toSelectOptions(template.penaltyOptions);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose accounting rules and map ledger accounts for this product.
      </p>

      <DetailSection title="Accounting rule">
        <fieldset className="space-y-2">
          <legend className="sr-only">Accounting rule</legend>
          {ruleOptions.map((option) => {
            const id = option.id ?? 0;
            const selected = rule === id;
            return (
              <label
                key={id}
                htmlFor={`deposit-accounting-rule-${id}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/40'
                )}
              >
                <input
                  id={`deposit-accounting-rule-${id}`}
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
        <DetailSection title="Ledger accounts">
          <div className="grid gap-4 sm:grid-cols-2">
            {CORE_ACCOUNT_FIELDS.map(({ key, label, optionKey }) => (
              <SelectField
                key={key}
                id={`accounting.${key}`}
                label={label}
                required
                value={
                  accounting[key] != null ? String(accounting[key]) : undefined
                }
                onValueChange={(value) => setAccountField(key, value)}
                options={glOptions(mappingOptions[optionKey])}
                error={errors[`accounting.${key}`]}
              />
            ))}
            {isAccrual
              ? ACCRUAL_ACCOUNT_FIELDS.map(({ key, label, optionKey }) => (
                  <SelectField
                    key={key}
                    id={`accounting.${key}`}
                    label={label}
                    required
                    value={
                      accounting[key] != null ? String(accounting[key]) : undefined
                    }
                    onValueChange={(value) => setAccountField(key, value)}
                    options={glOptions(mappingOptions[optionKey])}
                    error={errors[`accounting.${key}`]}
                  />
                ))
              : null}
          </div>
        </DetailSection>
      ) : null}

      {accountingEnabled ? (
        <DetailSection title="Advanced mappings">
          <SwitchField
            id="accounting.advancedAccountingRules"
            label="Configure payment channel and charge mappings"
            checked={accounting.advancedAccountingRules ?? false}
            onCheckedChange={(advancedAccountingRules) => onChange({ advancedAccountingRules })}
          />
          {accounting.advancedAccountingRules ? (
            <div className="mt-4 space-y-6">
              <MappingSection
                title="Payment channels"
                description="Map each payment channel to a fund source account."
                rows={accounting.paymentChannelToFundSourceMappings ?? []}
                leftLabel="Payment channel"
                rightLabel="Fund source account"
                leftOptions={toSelectOptions(template.paymentTypeOptions)}
                rightOptions={combinedGlOptions}
                leftKey="paymentTypeId"
                rightKey="fundSourceAccountId"
                onChange={(paymentChannelToFundSourceMappings) =>
                  onChange({ paymentChannelToFundSourceMappings })
                }
                leftErrorPrefix="accounting.paymentChannelToFundSourceMappings"
                rightErrorPrefix="accounting.paymentChannelToFundSourceMappings"
                errors={errors}
              />
              <MappingSection
                title="Fees"
                description="Map fees attached to this product to income accounts."
                rows={accounting.feeToIncomeAccountMappings ?? []}
                leftLabel="Fee"
                rightLabel="Income account"
                leftOptions={feeOptions}
                rightOptions={incomeOptions}
                leftKey="chargeId"
                rightKey="incomeAccountId"
                onChange={(feeToIncomeAccountMappings) => onChange({ feeToIncomeAccountMappings })}
                leftErrorPrefix="accounting.feeToIncomeAccountMappings"
                rightErrorPrefix="accounting.feeToIncomeAccountMappings"
                errors={errors}
              />
              <MappingSection
                title="Penalties"
                description="Map penalties attached to this product to income accounts."
                rows={accounting.penaltyToIncomeAccountMappings ?? []}
                leftLabel="Penalty"
                rightLabel="Income account"
                leftOptions={penaltyOptions}
                rightOptions={incomeOptions}
                leftKey="chargeId"
                rightKey="incomeAccountId"
                onChange={(penaltyToIncomeAccountMappings) =>
                  onChange({ penaltyToIncomeAccountMappings })
                }
                leftErrorPrefix="accounting.penaltyToIncomeAccountMappings"
                rightErrorPrefix="accounting.penaltyToIncomeAccountMappings"
                errors={errors}
              />
            </div>
          ) : null}
        </DetailSection>
      ) : null}
    </div>
  );
}

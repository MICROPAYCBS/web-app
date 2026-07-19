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
import { useMemo } from 'react';
import { DetailSection } from '@/components/composites';
import { SwitchField } from '@/components/composites/switch-field';
import { MappingSection } from '@/components/products/loan/wizard/steps/mapping-section';
import { ProductAccountingAccountFieldGroups } from '@/components/products/shared/product-accounting-account-field-groups';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  formatProductChargeOptionLabel,
  type ChargeAmountLike
} from '@/lib/fineract/charge-display';
import { ProductAccountingRuleField } from '@/components/products/shared/product-accounting-rule-field';
import {
  glAccountLabel,
  resolveSelectableAccountingRuleId
} from '@/lib/fineract/product-display';
import type { ProductAccountingAccountField } from '@/lib/fineract/product-accounting-groups';
import type { DepositProductStepProps } from '../types';

type DepositAccountFieldKey = keyof DepositProductAccountingInput;
type DepositAccountField = ProductAccountingAccountField<DepositAccountFieldKey> & {
  optionKey: keyof NonNullable<DepositProductStepProps['template']['accountingMappingOptions']>;
};

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const DEPOSIT_ACCOUNT_FIELDS: DepositAccountField[] = [
  {
    key: 'savingsReferenceAccountId',
    label: 'Saving reference',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'savingsControlAccountId',
    label: 'Saving control',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'transfersInSuspenseAccountId',
    label: 'Transfer in suspense',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'feesReceivableAccountId',
    label: 'Fees receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'penaltiesReceivableAccountId',
    label: 'Penalties receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'interestPayableAccountId',
    label: 'Interest payable',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'interestOnSavingsAccountId',
    label: 'Interest on savings',
    group: 'Expenses',
    optionKey: 'expenseAccountOptions'
  },
  {
    key: 'incomeFromFeeAccountId',
    label: 'Income from fees',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
  },
  {
    key: 'incomeFromPenaltyAccountId',
    label: 'Income from penalties',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
  }
];

const CASH_FIELD_KEYS = new Set<DepositAccountFieldKey>([
  'savingsReferenceAccountId',
  'savingsControlAccountId',
  'transfersInSuspenseAccountId',
  'interestOnSavingsAccountId',
  'incomeFromFeeAccountId',
  'incomeFromPenaltyAccountId'
]);

const ACCRUAL_FIELD_KEYS = new Set<DepositAccountFieldKey>([
  'feesReceivableAccountId',
  'penaltiesReceivableAccountId',
  'interestPayableAccountId'
]);

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
  const rule = resolveSelectableAccountingRuleId(
    accounting.accountingRule,
    template.accountingRuleOptions
  );
  const accountingEnabled = rule !== 1;
  const isAccrual = rule === 3;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const ruleOptions = template.accountingRuleOptions?.length
    ? template.accountingRuleOptions
    : [
        { id: 2, value: 'Cash', code: 'CASH' },
        { id: 3, value: 'Accrual (periodic)', code: 'ACCRUAL_PERIODIC' }
      ];

  const visibleFields = useMemo(() => {
    return DEPOSIT_ACCOUNT_FIELDS.filter((field) => {
      if (CASH_FIELD_KEYS.has(field.key)) {
        return true;
      }
      return isAccrual && ACCRUAL_FIELD_KEYS.has(field.key);
    });
  }, [isAccrual]);

  function setAccountField(key: DepositAccountFieldKey, value: string | undefined) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<DepositProductAccountingInput>);
  }

  function setRule(id: number) {
    const patch: Partial<DepositProductAccountingInput> = { accountingRule: id };
    if (id === 1) {
      for (const { key } of DEPOSIT_ACCOUNT_FIELDS) {
        (patch as Record<string, undefined>)[key] = undefined;
      }
    } else if (id === 2) {
      for (const key of ACCRUAL_FIELD_KEYS) {
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
        <ProductAccountingRuleField
          idPrefix="deposit-accounting-rule"
          options={ruleOptions}
          value={accounting.accountingRule}
          onChange={setRule}
          error={errors['accounting.accountingRule']}
        />
      </DetailSection>

      {accountingEnabled ? (
        <ProductAccountingAccountFieldGroups
          fields={visibleFields}
          getValue={(key) => accounting[key] as number | undefined}
          errors={errors}
          getOptions={(field) => glOptions(mappingOptions[field.optionKey])}
          onValueChange={setAccountField}
        />
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

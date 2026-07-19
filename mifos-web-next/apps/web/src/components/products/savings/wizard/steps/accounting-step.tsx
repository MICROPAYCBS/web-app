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
import { useMemo } from 'react';
import { DetailSection } from '@/components/composites';
import { ProductAccountingAccountFieldGroups } from '@/components/products/shared/product-accounting-account-field-groups';
import { ProductAccountingRuleField } from '@/components/products/shared/product-accounting-rule-field';
import { glAccountLabel, resolveSelectableAccountingRuleId } from '@/lib/fineract/product-display';
import type { ProductAccountingAccountField } from '@/lib/fineract/product-accounting-groups';
import type { SavingsProductStepProps } from '../types';

type SavingsAccountFieldKey = keyof SavingsProductAccountingInput;
type SavingsAccountField = ProductAccountingAccountField<SavingsAccountFieldKey> & {
  optionKey: keyof NonNullable<SavingsProductStepProps['template']['accountingMappingOptions']>;
};

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const SAVINGS_ACCOUNT_FIELDS: SavingsAccountField[] = [
  {
    key: 'savingsReferenceAccountId',
    label: 'Saving reference',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'overdraftPortfolioControlId',
    label: 'Overdraft portfolio control',
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
    key: 'interestReceivableAccountId',
    label: 'Interest receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions',
    optional: true
  },
  {
    key: 'interestPayableAccountId',
    label: 'Interest payable',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'escheatLiabilityId',
    label: 'Escheat liability',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'interestOnSavingsAccountId',
    label: 'Interest on savings',
    group: 'Expenses',
    optionKey: 'expenseAccountOptions'
  },
  { key: 'writeOffAccountId', label: 'Losses written off', group: 'Expenses', optionKey: 'expenseAccountOptions' },
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
  },
  {
    key: 'incomeFromInterestId',
    label: 'Income from interest',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
  }
];

const CASH_FIELD_KEYS = new Set<SavingsAccountFieldKey>([
  'savingsReferenceAccountId',
  'overdraftPortfolioControlId',
  'savingsControlAccountId',
  'transfersInSuspenseAccountId',
  'interestOnSavingsAccountId',
  'writeOffAccountId',
  'incomeFromFeeAccountId',
  'incomeFromPenaltyAccountId',
  'incomeFromInterestId'
]);

const ACCRUAL_FIELD_KEYS = new Set<SavingsAccountFieldKey>([
  'feesReceivableAccountId',
  'penaltiesReceivableAccountId',
  'interestPayableAccountId'
]);

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = resolveSelectableAccountingRuleId(
    accounting.accountingRule,
    template.accountingRuleOptions
  );
  const accountingEnabled = rule !== 1;
  const accrualEnabled = rule === 3;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const dormancyEnabled = draft.settings.isDormancyTrackingActive ?? false;
  const overdraftEnabled = draft.settings.allowOverdraft ?? false;

  const visibleFields = useMemo(() => {
    return SAVINGS_ACCOUNT_FIELDS.filter((field) => {
      if (CASH_FIELD_KEYS.has(field.key)) {
        return true;
      }
      if (ACCRUAL_FIELD_KEYS.has(field.key)) {
        return accrualEnabled;
      }
      if (field.key === 'interestReceivableAccountId') {
        return accrualEnabled && overdraftEnabled;
      }
      if (field.key === 'escheatLiabilityId') {
        return dormancyEnabled;
      }
      return false;
    });
  }, [accrualEnabled, dormancyEnabled, overdraftEnabled]);

  function setAccountField(key: SavingsAccountFieldKey, value: string | undefined) {
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
        <ProductAccountingRuleField
          options={template.accountingRuleOptions ?? []}
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
    </div>
  );
}

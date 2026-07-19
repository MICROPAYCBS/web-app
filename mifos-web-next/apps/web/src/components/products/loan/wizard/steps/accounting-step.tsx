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
import { useMemo } from 'react';
import { DetailSection } from '@/components/composites';
import { SwitchField } from '@/components/composites/switch-field';
import { ProductAccountingAccountFieldGroups } from '@/components/products/shared/product-accounting-account-field-groups';
import { ProductAccountingRuleField } from '@/components/products/shared/product-accounting-rule-field';
import { resolveSelectableAccountingRuleId } from '@/lib/fineract/product-display';
import type { ProductAccountingAccountField } from '@/lib/fineract/product-accounting-groups';
import type { LoanProductStepProps } from '../types';

type LoanAccountFieldKey = keyof LoanProductAccountingInput;
type LoanAccountField = ProductAccountingAccountField<LoanAccountFieldKey> & {
  optionKey: keyof NonNullable<LoanProductStepProps['template']['accountingMappingOptions']>;
};

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label:
      account.glCode && account.name
        ? `${account.glCode} — ${account.name}`
        : (account.name ?? account.glCode ?? `Account ${account.id}`)
  }));
}

const LOAN_ACCOUNT_FIELDS: LoanAccountField[] = [
  {
    key: 'fundSourceAccountId',
    label: 'Fund source',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'loanPortfolioAccountId',
    label: 'Loan portfolio',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'transfersInSuspenseAccountId',
    label: 'Transfer in suspense',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'receivableInterestAccountId',
    label: 'Interest receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'receivableFeeAccountId',
    label: 'Fees receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'receivablePenaltyAccountId',
    label: 'Penalties receivable',
    group: 'Assets',
    optionKey: 'assetAccountOptions'
  },
  {
    key: 'overpaymentLiabilityAccountId',
    label: 'Overpayment liability',
    group: 'Liabilities',
    optionKey: 'liabilityAccountOptions'
  },
  {
    key: 'interestOnLoanAccountId',
    label: 'Income from interest',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
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
  },
  {
    key: 'incomeFromRecoveryAccountId',
    label: 'Income from recovery',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
  },
  { key: 'writeOffAccountId', label: 'Losses written off', group: 'Expenses', optionKey: 'expenseAccountOptions' }
];

const ACCRUAL_FIELD_KEYS = new Set<LoanAccountFieldKey>([
  'receivableInterestAccountId',
  'receivableFeeAccountId',
  'receivablePenaltyAccountId'
]);

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: LoanProductStepProps & {
  onChange: (patch: Partial<LoanProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = resolveSelectableAccountingRuleId(
    accounting.accountingRule,
    template.accountingRuleOptions
  );
  const accountingEnabled = rule !== 1;
  const accrualEnabled = rule === 3 || rule === 4;
  const mappingOptions = template.accountingMappingOptions ?? {};

  const visibleFields = useMemo(() => {
    return LOAN_ACCOUNT_FIELDS.filter((field) => {
      if (ACCRUAL_FIELD_KEYS.has(field.key)) {
        return accrualEnabled;
      }
      return true;
    });
  }, [accrualEnabled]);

  function setAccountField(key: LoanAccountFieldKey, value: string | undefined) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<LoanProductAccountingInput>);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how loan transactions are posted to the general ledger.
      </p>

      <DetailSection title="Accounting rule">
        <ProductAccountingRuleField
          options={template.accountingRuleOptions ?? []}
          value={accounting.accountingRule}
          onChange={(id) => {
            const patch: Partial<LoanProductAccountingInput> = { accountingRule: id };
            if (id !== 3 && id !== 4) {
              patch.enableAccrualActivityPosting = undefined;
            }
            onChange(patch);
          }}
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
          footer={
            accrualEnabled ? (
              <DetailSection title="Accrual">
                <SwitchField
                  id="accounting.enableAccrualActivityPosting"
                  label="Accrual activity posting on due date"
                  checked={accounting.enableAccrualActivityPosting ?? false}
                  onCheckedChange={(enableAccrualActivityPosting) =>
                    onChange({ enableAccrualActivityPosting })
                  }
                  error={errors['accounting.enableAccrualActivityPosting']}
                />
              </DetailSection>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}

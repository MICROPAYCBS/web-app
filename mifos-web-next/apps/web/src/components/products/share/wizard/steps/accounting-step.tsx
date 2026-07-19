'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductAccountingInput } from '@mifos/validation';
import type { LoanProductGlAccountOption } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { ProductAccountingAccountFieldGroups } from '@/components/products/shared/product-accounting-account-field-groups';
import { ProductAccountingRuleField } from '@/components/products/shared/product-accounting-rule-field';
import { SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS } from '@/lib/fineract/share-product-accounting';
import { glAccountLabel, resolveSelectableAccountingRuleId } from '@/lib/fineract/product-display';
import type { ProductAccountingAccountField } from '@/lib/fineract/product-accounting-groups';
import type { ShareProductStepProps } from '../types';

type ShareAccountFieldKey = keyof ShareProductAccountingInput;
type ShareAccountField = ProductAccountingAccountField<ShareAccountFieldKey> & {
  optionKey: keyof NonNullable<ShareProductStepProps['template']['accountingMappingOptions']>;
};

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const SHARE_ACCOUNT_FIELDS: ShareAccountField[] = [
  { key: 'shareReferenceId', label: 'Share reference', group: 'Assets', optionKey: 'assetAccountOptions' },
  { key: 'shareSuspenseId', label: 'Share suspense', group: 'Liabilities', optionKey: 'liabilityAccountOptions' },
  { key: 'shareEquityId', label: 'Share equity', group: 'Equity', optionKey: 'equityAccountOptions' },
  {
    key: 'incomeFromFeeAccountId',
    label: 'Income from fees',
    group: 'Income',
    optionKey: 'incomeAccountOptions'
  }
];

export function AccountingStep({
  template,
  draft,
  errors,
  onChange
}: ShareProductStepProps & {
  onChange: (patch: Partial<ShareProductAccountingInput>) => void;
}) {
  const accounting = draft.accounting;
  const rule = resolveSelectableAccountingRuleId(
    accounting.accountingRule,
    template.accountingRuleOptions?.length
      ? template.accountingRuleOptions
      : SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS
  );
  const accountingEnabled = rule !== 1;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const ruleOptions = template.accountingRuleOptions?.length
    ? template.accountingRuleOptions
    : SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS;

  const hasGlAccounts = SHARE_ACCOUNT_FIELDS.some(
    ({ optionKey }) => (mappingOptions[optionKey]?.length ?? 0) > 0
  );

  function setAccountField(key: ShareAccountFieldKey, value: string | undefined) {
    onChange({ [key]: value ? Number(value) : undefined } as Partial<ShareProductAccountingInput>);
  }

  function setRule(id: number) {
    const patch: Partial<ShareProductAccountingInput> = { accountingRule: id };
    if (id === 1) {
      patch.shareReferenceId = undefined;
      patch.shareSuspenseId = undefined;
      patch.shareEquityId = undefined;
      patch.incomeFromFeeAccountId = undefined;
    }
    onChange(patch);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose whether this product uses cash accounting and map ledger accounts when enabled.
      </p>

      <DetailSection title="Accounting rule">
        <ProductAccountingRuleField
          options={ruleOptions}
          value={accounting.accountingRule}
          onChange={setRule}
          error={errors['accounting.accountingRule']}
        />
      </DetailSection>

      {accountingEnabled ? (
        !hasGlAccounts ? (
          <DetailSection title="Ledger accounts">
            <p className="text-sm text-muted-foreground">
              No ledger accounts are available for share products. Configure asset, liability,
              equity, and income accounts in accounting settings, then reopen this wizard.
            </p>
          </DetailSection>
        ) : (
          <ProductAccountingAccountFieldGroups
            fields={SHARE_ACCOUNT_FIELDS}
            getValue={(key) => accounting[key] as number | undefined}
            errors={errors}
            getOptions={(field) => glOptions(mappingOptions[field.optionKey])}
            onValueChange={setAccountField}
          />
        )
      ) : null}
    </div>
  );
}

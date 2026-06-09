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
import { SelectField } from '@/components/composites/select-field';
import { SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS } from '@/lib/fineract/share-product-accounting';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { cn } from '@/lib/utils';
import type { ShareProductStepProps } from '../types';

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

const ACCOUNT_FIELDS: {
  key: keyof ShareProductAccountingInput;
  label: string;
  optionKey: keyof NonNullable<ShareProductStepProps['template']['accountingMappingOptions']>;
}[] = [
  { key: 'shareReferenceId', label: 'Share reference', optionKey: 'assetAccountOptions' },
  { key: 'shareSuspenseId', label: 'Share suspense', optionKey: 'liabilityAccountOptions' },
  { key: 'shareEquityId', label: 'Share equity', optionKey: 'equityAccountOptions' },
  { key: 'incomeFromFeeAccountId', label: 'Income from fees', optionKey: 'incomeAccountOptions' }
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
  const rule = accounting.accountingRule ?? 1;
  const accountingEnabled = rule !== 1;
  const mappingOptions = template.accountingMappingOptions ?? {};
  const ruleOptions = (
    template.accountingRuleOptions?.length
      ? template.accountingRuleOptions
      : SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS
  ).filter((option) => option.id === 1 || option.id === 2);

  const hasGlAccounts = ACCOUNT_FIELDS.some(
    ({ optionKey }) => (mappingOptions[optionKey]?.length ?? 0) > 0
  );

  function setAccountField(key: keyof ShareProductAccountingInput, value: string | undefined) {
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
        <fieldset className="space-y-2">
          <legend className="sr-only">Accounting rule</legend>
          {ruleOptions.map((option) => {
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
        <DetailSection title="Ledger accounts">
          {!hasGlAccounts ? (
            <p className="text-sm text-muted-foreground">
              No ledger accounts are available for share products. Configure asset, liability,
              equity, and income accounts in accounting settings, then reopen this wizard.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {ACCOUNT_FIELDS.map(({ key, label, optionKey }) => (
                <SelectField
                  key={key}
                  id={`accounting.${key}`}
                  label={label}
                  required
                  value={accounting[key] != null ? String(accounting[key]) : undefined}
                  onValueChange={(value) => setAccountField(key, value)}
                  options={glOptions(mappingOptions[optionKey])}
                  error={errors[`accounting.${key}`]}
                />
              ))}
            </div>
          )}
        </DetailSection>
      ) : null}
    </div>
  );
}

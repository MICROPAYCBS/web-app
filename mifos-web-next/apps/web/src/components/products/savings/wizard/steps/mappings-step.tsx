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
import { MappingSection } from '@/components/products/loan/wizard/steps/mapping-section';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  formatProductChargeOptionLabel,
  type ChargeAmountLike
} from '@/lib/fineract/charge-display';
import { glAccountLabel } from '@/lib/fineract/product-display';
import type { SavingsProductStepProps } from '../types';

type PaymentChannelMapping = {
  paymentTypeId: number;
  fundSourceAccountId: number;
};

type ChargeIncomeMapping = {
  chargeId: number;
  incomeAccountId: number;
};

function glOptions(accounts: LoanProductGlAccountOption[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
}

function allGlOptions(mappingOptions: SavingsProductStepProps['template']['accountingMappingOptions']) {
  const combined = [
    ...(mappingOptions?.assetAccountOptions ?? []),
    ...(mappingOptions?.incomeAccountOptions ?? []),
    ...(mappingOptions?.expenseAccountOptions ?? []),
    ...(mappingOptions?.liabilityAccountOptions ?? [])
  ];
  return glOptions(combined);
}

function chargeOptionsForIds(
  options: SavingsProductStepProps['template']['chargeOptions'],
  selectedIds: number[],
  currencyCode?: string
) {
  const selected = new Set(selectedIds);
  return (options ?? [])
    .filter((option) => Number.isFinite(option.id) && selected.has(option.id))
    .map((option) => ({
      value: String(option.id),
      label: formatProductChargeOptionLabel(option as ChargeAmountLike, currencyCode)
    }));
}

export function MappingsStep({
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
  const mappingOptions = template.accountingMappingOptions ?? {};
  const combinedGlOptions = allGlOptions(mappingOptions);
  const incomeOptions = glOptions(mappingOptions.incomeAccountOptions);
  const selectedChargeIds = draft.charges.chargeIds ?? [];
  const currencyCode = draft.currency.currencyCode?.trim().toUpperCase();

  const feeOptions =
    selectedChargeIds.length > 0
      ? chargeOptionsForIds(template.chargeOptions, selectedChargeIds, currencyCode)
      : toSelectOptions(template.chargeOptions);

  const penaltyOptions =
    selectedChargeIds.length > 0
      ? chargeOptionsForIds(template.penaltyOptions, selectedChargeIds, currencyCode)
      : toSelectOptions(template.penaltyOptions);

  if (!accountingEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Map payment channels, fees, and penalties to ledger accounts. These mappings apply when
          cash or accrual accounting is enabled.
        </p>
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          This product uses <strong className="font-medium text-foreground">none</strong> accounting.
          Choose cash or accrual on the Accounting step to configure mappings, or continue to Preview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Optionally map payment channels, fees, and penalties to specific ledger accounts. Incomplete
        rows are ignored when you save.
      </p>

      <MappingSection<PaymentChannelMapping>
        title="Payment channels"
        description="Map each payment channel to a fund source account."
        rows={accounting.paymentChannelToFundSourceMappings ?? []}
        leftLabel="Payment channel"
        rightLabel="Fund source account"
        leftOptions={toSelectOptions(template.paymentTypeOptions)}
        rightOptions={combinedGlOptions}
        onChange={(paymentChannelToFundSourceMappings) =>
          onChange({ paymentChannelToFundSourceMappings })
        }
        leftKey="paymentTypeId"
        rightKey="fundSourceAccountId"
        leftErrorPrefix="accounting.paymentChannelToFundSourceMappings"
        rightErrorPrefix="accounting.paymentChannelToFundSourceMappings"
        errors={errors}
      />

      <MappingSection<ChargeIncomeMapping>
        title="Fees"
        description="Map fees attached to this product to income accounts."
        rows={accounting.feeToIncomeAccountMappings ?? []}
        leftLabel="Fee"
        rightLabel="Income account"
        leftOptions={feeOptions}
        rightOptions={incomeOptions}
        onChange={(feeToIncomeAccountMappings) => onChange({ feeToIncomeAccountMappings })}
        leftKey="chargeId"
        rightKey="incomeAccountId"
        leftErrorPrefix="accounting.feeToIncomeAccountMappings"
        rightErrorPrefix="accounting.feeToIncomeAccountMappings"
        errors={errors}
      />

      <MappingSection<ChargeIncomeMapping>
        title="Penalties"
        description="Map penalties attached to this product to income accounts."
        rows={accounting.penaltyToIncomeAccountMappings ?? []}
        leftLabel="Penalty"
        rightLabel="Income account"
        leftOptions={penaltyOptions}
        rightOptions={incomeOptions}
        onChange={(penaltyToIncomeAccountMappings) =>
          onChange({ penaltyToIncomeAccountMappings })
        }
        leftKey="chargeId"
        rightKey="incomeAccountId"
        leftErrorPrefix="accounting.penaltyToIncomeAccountMappings"
        rightErrorPrefix="accounting.penaltyToIncomeAccountMappings"
        errors={errors}
      />

      {selectedChargeIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fees are selected on the Charges step. You can still map any available charge, or add
          charges first and return here.
        </p>
      ) : null}
    </div>
  );
}

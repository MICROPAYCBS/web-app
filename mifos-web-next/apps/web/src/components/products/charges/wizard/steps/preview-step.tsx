'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import {
  chargePaymentModeOptions,
  chargeTimeTypeOptions,
  filteredChargeCalculationTypeOptions,
  incomeAccountOptions,
  showChargePaymentMode,
  showIncomeAccountField,
  showMinMaxCap,
  showTaxGroupField
} from '@/lib/fineract/charge-form-logic';
import { formatChargeAmountDisplay } from '@/lib/fineract/charge-display';
import { fineractOptionLabel } from '@/lib/form/select-options';
import { glAccountLabel } from '@/lib/fineract/product-display';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import type { ChargeStepProps } from '../types';

function optionLabelById(
  options: { id: number; name?: string; value?: string }[] | undefined,
  id?: number
): string {
  if (id == null) {
    return '—';
  }
  const match = options?.find((option) => option.id === id);
  return match ? fineractOptionLabel(match) : String(id);
}

export function PreviewStep({
  mode,
  template,
  draft,
  submitError
}: ChargeStepProps & {
  submitError: string | null;
}) {
  const currencyCode = draft.currencyCode ?? '';
  const chargeAppliesTo = draft.chargeAppliesTo;
  const amountLabel = formatChargeAmountDisplay(
    {
      amount: draft.amount,
      currencyCode,
      chargeCalculationType: { id: draft.chargeCalculationType }
    },
    currencyCode
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the charge before {mode === 'create' ? 'creating' : 'saving'}.
      </p>

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Applies to">
        <DetailFieldGrid>
          <DetailField label="Applies to">
            {optionLabelById(template.chargeAppliesToOptions, chargeAppliesTo)}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Terms">
        <DetailFieldGrid>
          <DetailField label="Name">{draft.name || '—'}</DetailField>
          <DetailField label="Currency">{currencyCode || '—'}</DetailField>
          <DetailField label="Charge time type">
            {optionLabelById(
              chargeTimeTypeOptions(template, chargeAppliesTo),
              draft.chargeTimeType
            )}
          </DetailField>
          <DetailField label="Calculation type">
            {optionLabelById(
              filteredChargeCalculationTypeOptions(
                template,
                chargeAppliesTo,
                draft.chargeTimeType
              ),
              draft.chargeCalculationType
            )}
          </DetailField>
          {showChargePaymentMode(chargeAppliesTo) ? (
            <DetailField label="Payment mode">
              {optionLabelById(
                chargePaymentModeOptions(template, chargeAppliesTo),
                draft.chargePaymentMode
              )}
            </DetailField>
          ) : null}
          {draft.feeOnMonthDay ? (
            <DetailField label="Due date">{draft.feeOnMonthDay}</DetailField>
          ) : null}
          {draft.feeInterval != null ? (
            <DetailField label="Repeat / interval">{draft.feeInterval}</DetailField>
          ) : null}
          {draft.feeFrequency != null ? (
            <DetailField label="Charge frequency">
              {optionLabelById(template.feeFrequencyOptions, draft.feeFrequency)}
            </DetailField>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Amount & settings">
        <DetailFieldGrid>
          <DetailField label="Amount">{amountLabel}</DetailField>
          {showMinMaxCap(chargeAppliesTo, draft.chargeTimeType, draft.chargeCalculationType) &&
          draft.minCap != null ? (
            <DetailField label="Minimum cap">
              {formatChargeAmountDisplay(
                {
                  amount: draft.minCap,
                  currencyCode,
                  chargeCalculationType: { id: draft.chargeCalculationType }
                },
                currencyCode
              )}
            </DetailField>
          ) : null}
          {showMinMaxCap(chargeAppliesTo, draft.chargeTimeType, draft.chargeCalculationType) &&
          draft.maxCap != null ? (
            <DetailField label="Maximum cap">
              {formatChargeAmountDisplay(
                {
                  amount: draft.maxCap,
                  currencyCode,
                  chargeCalculationType: { id: draft.chargeCalculationType }
                },
                currencyCode
              )}
            </DetailField>
          ) : null}
          {showIncomeAccountField(chargeAppliesTo) ? (
            <DetailField label="Income from charge">
              {draft.incomeAccountId
                ? glAccountLabel(
                    incomeAccountOptions(template).find(
                      (account) => account.id === draft.incomeAccountId
                    )
                  )
                : '—'}
            </DetailField>
          ) : null}
          {showTaxGroupField(chargeAppliesTo) ? (
            <DetailField label="Tax group">
              {draft.taxGroupId
                ? (template.taxGroupOptions?.find((group) => group.id === draft.taxGroupId)
                    ?.name ?? draft.taxGroupId)
                : '—'}
            </DetailField>
          ) : null}
          <DetailField label="Active">{formatYesNo(draft.active)}</DetailField>
          <DetailField label="Penalty">{formatYesNo(draft.penalty)}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </div>
  );
}

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
  DetailSection,
  EmptyState
} from '@/components/composites';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Layers } from 'lucide-react';
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
import {
  formatChargeAmountDisplay,
  formatChargeTierRange,
  isFlatChargeCalculation
} from '@/lib/fineract/charge-display';
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
  const useChargeTiers = draft.useChargeTiers === true;
  const tiers = draft.chargeTiers ?? [];
  const flatAmount = isFlatChargeCalculation(draft.chargeCalculationType);
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
          <DetailField label="Use charge tiers">{formatYesNo(useChargeTiers)}</DetailField>
          {useChargeTiers ? null : <DetailField label="Amount">{amountLabel}</DetailField>}
          {!useChargeTiers &&
          showMinMaxCap(
            chargeAppliesTo,
            draft.chargeTimeType,
            draft.chargeCalculationType,
            useChargeTiers
          ) &&
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
          {!useChargeTiers &&
          showMinMaxCap(
            chargeAppliesTo,
            draft.chargeTimeType,
            draft.chargeCalculationType,
            useChargeTiers
          ) &&
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
        </DetailFieldGrid>

        {useChargeTiers ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Charge tiers</p>
            {tiers.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No charge tiers added"
                description="Go back to Amount & settings and add at least one lookup band before creating this charge."
                className="border-destructive/40"
              />
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From – To</TableHead>
                      <TableHead className="text-right">
                        {flatAmount ? 'Amount' : 'Rate (%)'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell className="tabular-nums">
                          {formatChargeTierRange(
                            tier.amountRangeFrom,
                            tier.amountRangeTo,
                            currencyCode
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatChargeAmountDisplay(
                            {
                              amount: tier.amount,
                              currencyCode,
                              chargeCalculationType: { id: draft.chargeCalculationType }
                            },
                            currencyCode
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}

        <DetailFieldGrid className="mt-4">
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

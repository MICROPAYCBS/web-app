'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountChargeItemInput } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DetailSection } from '@/components/composites';
import { DateField } from '@/components/composites/date-field';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { ProductChargesTable } from '@/components/products/shared/product-charges-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  chargeAmountForApplication,
  chargeDateLabel,
  chargeExpectsDueDate,
  chargeExpectsFeeOnMonthDay,
  formatLoanAccountChargeDate,
  loanAccountChargeMetadata,
  loanAccountChargeOptionsForApplication
} from '@/lib/fineract/loan-application-charges';
import {
  chargeAmountCurrencyCode,
  chargeAmountInputLabel,
  formatChargeAmountDisplay,
  formatChargeAmountRangeHint,
  formatProductChargeOptionLabel,
  isFlatChargeCalculation,
  isPercentageChargeCalculation
} from '@/lib/fineract/charge-display';
import { loanApplicationAllowedRangeDescription } from '@/lib/fineract/loan-application-rules';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import type { LoanAccountStepErrors } from '../validation';

function chargeRowKey(charge: LoanAccountChargeItemInput, index: number): string {
  return `loan-charge-${charge.chargeId}-${index}`;
}

function chargeAmountValue(amount: number | undefined): string {
  return amount != null && Number.isFinite(amount) ? String(amount) : '';
}

function chargeAmountFieldKey(index: number): string {
  return `charges.${index}.amount`;
}

function chargeAmountDescription(
  meta: ReturnType<typeof loanAccountChargeMetadata>,
  currencyCode?: string
): string | undefined {
  const parts: string[] = [];
  const defaultLabel = meta ? formatChargeAmountDisplay(meta, currencyCode) : undefined;

  if (defaultLabel && defaultLabel !== '—') {
    const calculationLabel = meta?.chargeCalculationType
      ? enumOptionLabel(meta.chargeCalculationType)
      : undefined;
    parts.push(
      isPercentageChargeCalculation(meta?.chargeCalculationType?.id) && calculationLabel
        ? `Default: ${defaultLabel} (${calculationLabel})`
        : `Default: ${defaultLabel}`
    );
  } else if (
    meta?.chargeCalculationType &&
    isPercentageChargeCalculation(meta.chargeCalculationType.id)
  ) {
    const basis = enumOptionLabel(meta.chargeCalculationType);
    if (basis) {
      parts.push(`Based on ${basis.toLowerCase()}.`);
    }
  }

  const rangeHint = meta ? formatChargeAmountRangeHint(meta, currencyCode) : undefined;
  const rangeDescription = loanApplicationAllowedRangeDescription(rangeHint);
  if (rangeDescription) {
    parts.push(rangeDescription);
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}

function LoanAccountChargeAmountField({
  charge,
  meta,
  currencyCode,
  rowIndex,
  error,
  onChange
}: {
  charge: LoanAccountChargeItemInput;
  meta: ReturnType<typeof loanAccountChargeMetadata>;
  currencyCode?: string;
  rowIndex: number;
  error?: string;
  onChange: (amount: number) => void;
}) {
  const calculationTypeId = meta?.chargeCalculationType?.id;
  const flatAmount =
    isFlatChargeCalculation(calculationTypeId) ||
    !isPercentageChargeCalculation(calculationTypeId);
  const amountCurrencyCode = chargeAmountCurrencyCode(meta, currencyCode);
  const description = chargeAmountDescription(meta, currencyCode);
  const value = chargeAmountValue(charge.amount);

  if (flatAmount) {
    return (
      <MoneyField
        id={`loan-charge-amount-${charge.chargeId}-${rowIndex}`}
        label={chargeAmountInputLabel(meta)}
        hideLabel
        currencyCode={amountCurrencyCode}
        value={value}
        onChange={(next) => onChange(next === '' ? 0 : Number(next))}
        description={description}
        error={error}
      />
    );
  }

  return (
    <NumericField
      id={`loan-charge-amount-${charge.chargeId}-${rowIndex}`}
      label={chargeAmountInputLabel(meta)}
      hideLabel
      value={value}
      maxDecimalPlaces={6}
      onChange={(next) => onChange(next === '' ? 0 : Number(next))}
      description={description}
      error={error}
    />
  );
}

export function LoanAccountChargesStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: { charges: LoanAccountChargeItemInput[]; productId: number };
  errors: LoanAccountStepErrors;
  onChange: (patch: { charges: LoanAccountChargeItemInput[] }) => void;
}) {
  const [selectedChargeId, setSelectedChargeId] = useState<string | undefined>();
  const currencyCode = template.currency?.code;
  const charges = draft.charges ?? [];
  const templateMatchesProduct =
    draft.productId > 0 && template.product?.id === draft.productId;

  const availableOptions = useMemo(
    () => (templateMatchesProduct ? loanAccountChargeOptionsForApplication(template) : []),
    [template, templateMatchesProduct]
  );

  const addableOptions = useMemo(() => {
    const selected = new Set(charges.map((charge) => charge.chargeId));
    return availableOptions.filter((option) => {
      const id = option.chargeId ?? option.id;
      return id != null && !selected.has(id);
    });
  }, [availableOptions, charges]);

  const selectOptions = addableOptions.map((option) => {
    const id = option.chargeId ?? option.id;
    return {
      value: String(id),
      label: formatProductChargeOptionLabel(option, currencyCode)
    };
  });

  function updateCharge(index: number, patch: Partial<LoanAccountChargeItemInput>) {
    onChange({
      charges: charges.map((charge, chargeIndex) =>
        chargeIndex === index ? { ...charge, ...patch } : charge
      )
    });
  }

  function removeCharge(index: number) {
    onChange({
      charges: charges.filter((_, chargeIndex) => chargeIndex !== index)
    });
  }

  function addSelectedCharge() {
    if (!selectedChargeId) {
      return;
    }
    const chargeId = Number(selectedChargeId);
    const option = availableOptions.find(
      (row) => (row.chargeId ?? row.id) === chargeId
    );
    if (!option) {
      return;
    }
    onChange({
      charges: [
        ...charges,
        {
          chargeId,
          amount: chargeAmountForApplication(option)
        }
      ]
    });
    setSelectedChargeId(undefined);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Charges linked to the loan product are added automatically. Add other loan fees in the
        same currency as this application, adjust amounts, and set due dates where required.
      </p>

      {!templateMatchesProduct ? (
        <p className="text-sm text-muted-foreground">Loading charges for the selected product…</p>
      ) : (
        <>
      <DetailSection title="Application charges">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <SelectField
              label="Add charge"
              optional
              placeholder={
                selectOptions.length > 0 ? 'Select a charge' : 'No more charges available'
              }
              value={selectedChargeId}
              onValueChange={setSelectedChargeId}
              options={selectOptions}
              disabled={selectOptions.length === 0}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedChargeId}
            onClick={addSelectedCharge}
          >
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </div>

        {errors.charges ? (
          <p className="mb-4 text-sm text-destructive">{errors.charges}</p>
        ) : null}

        {charges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No charges on this application yet. Add fees from the list above or continue if none
            apply.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Collected on</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[72px]">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge, index) => {
                  const meta = loanAccountChargeMetadata(template, charge.chargeId);
                  const showDueDate = chargeExpectsDueDate(meta);
                  const showFeeOnMonthDay = chargeExpectsFeeOnMonthDay(meta) && !showDueDate;

                  return (
                    <TableRow key={chargeRowKey(charge, index)}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{meta?.name ?? `#${charge.chargeId}`}</span>
                          {meta?.penalty ? <Badge variant="outline">Penalty</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {enumOptionLabel(meta?.chargeCalculationType) ?? '—'}
                      </TableCell>
                      <TableCell>{enumOptionLabel(meta?.chargeTimeType) ?? '—'}</TableCell>
                      <TableCell>
                        <div className="min-w-[180px]">
                          <LoanAccountChargeAmountField
                            charge={charge}
                            meta={meta}
                            currencyCode={currencyCode}
                            rowIndex={index}
                            error={errors[chargeAmountFieldKey(index)]}
                            onChange={(amount) => updateCharge(index, { amount })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {showDueDate ? (
                          <DateField
                            label={chargeDateLabel(meta)}
                            value={charge.dueDate ?? ''}
                            onChange={(dueDate) => updateCharge(index, { dueDate })}
                            allowFuture
                          />
                        ) : showFeeOnMonthDay ? (
                          <DateField
                            label={chargeDateLabel(meta)}
                            value={charge.feeOnMonthDay ?? ''}
                            onChange={(feeOnMonthDay) =>
                              updateCharge(index, { feeOnMonthDay })
                            }
                            allowFuture
                          />
                        ) : (
                          formatLoanAccountChargeDate(charge)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${meta?.name ?? 'charge'}`}
                          onClick={() => removeCharge(index)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DetailSection>

      {(template.overdueCharges?.length ?? 0) > 0 ? (
        <DetailSection title="Overdue charges">
          <p className="mb-4 text-sm text-muted-foreground">
            These penalty charges apply when installments are overdue. They are configured on the
            product and cannot be changed here.
          </p>
          <ProductChargesTable
            charges={template.overdueCharges ?? []}
            currencyCode={currencyCode}
            emptyMessage="No overdue charges."
          />
        </DetailSection>
      ) : null}
        </>
      )}
    </div>
  );
}

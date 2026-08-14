'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  appendOpenEndedChargeTier,
  removeChargeTierAndRechain,
  replaceChargeTierAndRechain,
  type ChargeTierInput
} from '@mifos/validation';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChargeWizardDraft } from '../types';
import { EmptyState } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
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
  formatChargeAmountDisplay,
  formatChargeTierRange,
  isFlatChargeCalculation
} from '@/lib/fineract/charge-display';
import {
  incomeAccountOptions,
  penaltyDisabled,
  showChargeTiersToggle,
  showIncomeAccountField,
  showMinMaxCap,
  showTaxGroupField
} from '@/lib/fineract/charge-form-logic';
import { glAccountLabel } from '@/lib/fineract/product-display';
import { useDraftNumericInput } from '@/lib/form/use-draft-numeric-input';
import type { ChargeStepProps } from '../types';
import { ChargeTierFormSheet } from './charge-tier-form-sheet';

type TierSheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; index: number };

export function AmountSettingsStep({
  mode,
  template,
  draft,
  errors,
  onChange
}: ChargeStepProps & {
  onChange: (patch: Partial<ChargeWizardDraft>) => void;
}) {
  const currencyCode = draft.currencyCode || undefined;
  const chargeAppliesTo = draft.chargeAppliesTo;
  const chargeTimeType = draft.chargeTimeType;
  const chargeCalculationType = draft.chargeCalculationType;
  const useChargeTiers = draft.useChargeTiers === true;
  const taxLocked = mode === 'edit' && Boolean(template.taxGroup?.id);
  const flatAmount = isFlatChargeCalculation(chargeCalculationType);
  const amountResetKey = `${chargeCalculationType ?? ''}-${flatAmount}`;
  const tiersAllowed = showChargeTiersToggle(chargeAppliesTo, chargeTimeType);
  const tiers = draft.chargeTiers ?? [];
  const [tierSheet, setTierSheet] = useState<TierSheetState>({ mode: 'closed' });

  const amount = useDraftNumericInput(
    draft.amount,
    (value) => onChange({ amount: value }),
    amountResetKey
  );
  const minCap = useDraftNumericInput(
    draft.minCap,
    (value) => onChange({ minCap: value }),
    amountResetKey
  );
  const maxCap = useDraftNumericInput(
    draft.maxCap,
    (value) => onChange({ maxCap: value }),
    amountResetKey
  );

  const glOptions = incomeAccountOptions(template).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
  const taxOptions = (template.taxGroupOptions ?? []).map((group) => ({
    value: String(group.id),
    label: group.name ?? String(group.id)
  }));

  const editingTier = useMemo(() => {
    if (tierSheet.mode !== 'edit') {
      return undefined;
    }
    return tiers[tierSheet.index];
  }, [tierSheet, tiers]);

  const lastFrom = tiers[tiers.length - 1]?.amountRangeFrom;
  const canAddTier = tiers.length === 0 || lastFrom != null;
  const isCreating = tierSheet.mode === 'create';
  const isFirstCreate = isCreating && tiers.length === 0;
  const isEditingLast =
    tierSheet.mode === 'edit' && tierSheet.index === tiers.length - 1;
  const lockFrom = !isCreating || isFirstCreate;
  const lockTo = isCreating || isEditingLast;
  const minFrom =
    isCreating && !isFirstCreate && lastFrom != null ? lastFrom : undefined;
  const maxTo =
    tierSheet.mode === 'edit' &&
    tierSheet.index < tiers.length - 1 &&
    tiers[tierSheet.index + 1]?.amountRangeTo != null
      ? (tiers[tierSheet.index + 1]?.amountRangeTo ?? undefined)
      : undefined;

  function asChainRows(): ChargeTierInput[] {
    return tiers.map((tier) => ({
      amountRangeFrom: tier.amountRangeFrom ?? 0,
      amountRangeTo: tier.amountRangeTo ?? null,
      amount: tier.amount ?? 0
    }));
  }

  function setTiers(next: ChargeTierInput[]) {
    onChange({
      chargeTiers: next.map((tier) => ({
        amountRangeFrom: tier.amountRangeFrom,
        amountRangeTo: tier.amountRangeTo ?? null,
        amount: tier.amount
      }))
    });
  }

  function handleTiersToggle(enabled: boolean) {
    // Base UI Switch can re-fire the current checked value (e.g. on remount/unmount).
    // Never rewrite chargeTiers on enable — a stale empty `tiers` snapshot was wiping rows
    // while leaving useChargeTiers true (Review: Yes, no tiers).
    if (enabled === useChargeTiers) {
      return;
    }
    if (enabled) {
      onChange({
        useChargeTiers: true,
        amount: 0,
        minCap: undefined,
        maxCap: undefined
      });
      return;
    }
    onChange({
      useChargeTiers: false,
      chargeTiers: [],
      amount: undefined
    });
  }

  function handleSaveTier(tier: ChargeTierInput) {
    if (tierSheet.mode === 'edit') {
      setTiers(replaceChargeTierAndRechain(asChainRows(), tierSheet.index, tier));
      return;
    }
    setTiers(appendOpenEndedChargeTier(asChainRows(), tier.amountRangeFrom, tier.amount));
  }

  function removeTier(index: number) {
    setTiers(removeChargeTierAndRechain(asChainRows(), index));
  }

  const capFields = flatAmount ? (
    <>
      <MoneyField
        id="minCap"
        label="Minimum charge cap"
        optional
        currencyCode={currencyCode}
        value={minCap.input}
        onChange={minCap.onInputChange}
        onBlur={minCap.onInputBlur}
        error={errors.minCap}
      />
      <MoneyField
        id="maxCap"
        label="Maximum charge cap"
        optional
        currencyCode={currencyCode}
        value={maxCap.input}
        onChange={maxCap.onInputChange}
        onBlur={maxCap.onInputBlur}
        error={errors.maxCap}
      />
    </>
  ) : (
    <>
      <NumericField
        id="minCap"
        label="Minimum charge cap (%)"
        optional
        value={minCap.input}
        onChange={minCap.onInputChange}
        onBlur={minCap.onInputBlur}
        error={errors.minCap}
        maxDecimalPlaces={6}
      />
      <NumericField
        id="maxCap"
        label="Maximum charge cap (%)"
        optional
        value={maxCap.input}
        onChange={maxCap.onInputChange}
        onBlur={maxCap.onInputBlur}
        error={errors.maxCap}
        maxDecimalPlaces={6}
      />
    </>
  );

  const amountColumnLabel = flatAmount ? 'Amount' : 'Rate (%)';

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set the charge amount, optional caps, accounting links, and status flags.
      </p>

      {tiersAllowed ? (
        <SwitchField
          id="useChargeTiers"
          label="Use charge tiers"
          description="Lookup bands by base amount. One matching tier applies — not progressive stacking."
          checked={useChargeTiers}
          onCheckedChange={handleTiersToggle}
          error={errors.useChargeTiers}
        />
      ) : null}

      {useChargeTiers && tiersAllowed ? (
        <div className="space-y-3">
          {tiers.length === 0 ? (
            <>
              {errors.chargeTiers ? (
                <p className="text-sm text-destructive">{errors.chargeTiers}</p>
              ) : null}
              <EmptyState
                icon={Layers}
                title="No charge tiers yet"
                description="Add lookup bands by base amount. The first band starts at 0 with no upper limit. Each next band starts where the previous ends, and the last always stays open-ended."
                action={
                  <Button type="button" size="sm" onClick={() => setTierSheet({ mode: 'create' })} disabled={!canAddTier}>
                    <Plus className="mr-1 size-4" />
                    Add tier
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Charge tiers</p>
                  <p className="text-sm text-muted-foreground">
                    Bands chain automatically with no gaps or overlaps. The last band is
                    listed as "and above" (no upper limit).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTierSheet({ mode: 'create' })}
                  disabled={!canAddTier}
                >
                  <Plus className="mr-1 size-4" />
                  Add tier
                </Button>
              </div>

              {errors.chargeTiers ? (
                <p className="text-sm text-destructive">{errors.chargeTiers}</p>
              ) : null}

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From – To</TableHead>
                      <TableHead className="text-right">{amountColumnLabel}</TableHead>
                      <TableHead className="w-[1%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier, index) => {
                      const rowError =
                        errors[`chargeTiers.${index}.amountRangeFrom`] ||
                        errors[`chargeTiers.${index}.amountRangeTo`] ||
                        errors[`chargeTiers.${index}.amount`];
                      return (
                        <TableRow key={index}>
                          <TableCell className="align-top tabular-nums">
                            {formatChargeTierRange(
                              tier.amountRangeFrom,
                              tier.amountRangeTo,
                              currencyCode
                            )}
                            {rowError ? (
                              <p className="mt-1 text-xs text-destructive">{rowError}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-top text-right tabular-nums">
                            {tier.amount != null
                              ? formatChargeAmountDisplay(
                                  {
                                    amount: tier.amount,
                                    currencyCode,
                                    chargeCalculationType: { id: chargeCalculationType }
                                  },
                                  currencyCode
                                )
                              : '—'}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setTierSheet({ mode: 'edit', index })}
                              >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit tier</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTier(index)}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Remove tier</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flatAmount ? (
            <MoneyField
              id="amount"
              label="Amount"
              required
              currencyCode={currencyCode}
              value={amount.input}
              onChange={amount.onInputChange}
              onBlur={amount.onInputBlur}
              error={errors.amount}
            />
          ) : (
            <NumericField
              id="amount"
              label="Amount (%)"
              required
              value={amount.input}
              onChange={amount.onInputChange}
              onBlur={amount.onInputBlur}
              error={errors.amount}
              hint="Percentage of the base amount, e.g. 0.5 for 0.5%."
              placeholder="0.5"
              maxDecimalPlaces={6}
            />
          )}
          {showMinMaxCap(
            chargeAppliesTo,
            chargeTimeType,
            chargeCalculationType,
            useChargeTiers
          )
            ? capFields
            : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {showIncomeAccountField(chargeAppliesTo) ? (
          <SelectField
            id="incomeAccountId"
            label="Income from charge"
            required
            value={draft.incomeAccountId != null ? String(draft.incomeAccountId) : undefined}
            onValueChange={(value) =>
              onChange({ incomeAccountId: value ? Number(value) : undefined })
            }
            options={glOptions}
            error={errors.incomeAccountId}
          />
        ) : null}
        {showTaxGroupField(chargeAppliesTo) ? (
          <SelectField
            id="taxGroupId"
            label="Tax group"
            optional
            value={
              taxLocked && template.taxGroup?.id
                ? String(template.taxGroup.id)
                : draft.taxGroupId != null
                  ? String(draft.taxGroupId)
                  : undefined
            }
            onValueChange={(value) =>
              onChange({ taxGroupId: value ? Number(value) : undefined })
            }
            options={taxOptions}
            error={errors.taxGroupId}
            disabled={taxLocked}
          />
        ) : null}
        <SwitchField
          id="active"
          label="Active"
          checked={draft.active ?? false}
          onCheckedChange={(active) => onChange({ active })}
        />
        <SwitchField
          id="penalty"
          label="Penalty"
          checked={draft.penalty ?? false}
          onCheckedChange={(penalty) => onChange({ penalty })}
          disabled={penaltyDisabled(chargeAppliesTo) || chargeTimeType === 9}
        />
      </div>

      <ChargeTierFormSheet
        open={tierSheet.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) {
            setTierSheet({ mode: 'closed' });
          }
        }}
        tier={editingTier}
        defaultFrom={isFirstCreate ? 0 : undefined}
        lockFrom={lockFrom}
        lockTo={lockTo}
        minFrom={minFrom}
        maxTo={maxTo}
        flatAmount={flatAmount}
        currencyCode={currencyCode}
        onSave={handleSaveTier}
      />
    </div>
  );
}

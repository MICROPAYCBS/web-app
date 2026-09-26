'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductPaymentChannelsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { ProductChargeCheckboxList } from '@/components/products/shared/product-charge-checkbox-list';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ChargeAmountLike } from '@/lib/fineract/charge-display';
import { pruneProductChargeAmounts } from '@/lib/fineract/product-charge-links';
import { fineractOptionLabel } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';
import type { SavingsProductStepProps } from '../types';

type ChannelRow = SavingsProductPaymentChannelsInput['channels'][number];

function chargeOptions(template: SavingsProductStepProps['template']): ChargeAmountLike[] {
  return (template.chargeOptions ?? []).filter((option) => Number.isFinite(option.id));
}

export function PaymentChannelsStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductPaymentChannelsInput>) => void;
}) {
  const options = template.paymentTypeOptions ?? [];
  const channels = draft.paymentChannels.channels ?? [];
  const byTypeId = new Map(channels.map((row) => [row.paymentTypeId, row]));
  const optionIds = new Set(options.map((option) => option.id));
  const catalogOptions = [
    ...options,
    ...channels
      .filter((row) => !optionIds.has(row.paymentTypeId))
      .map((row) => ({ id: row.paymentTypeId, name: `Payment type ${row.paymentTypeId}` }))
  ];
  const feeOptions = chargeOptions(template);
  const currencyCode = draft.currency.currencyCode?.trim().toUpperCase();
  const stepError = Object.values(errors)[0];

  function write(next: ChannelRow[]) {
    const seenTypes = new Set<number>();
    const channels: ChannelRow[] = [];
    for (const row of next) {
      if (seenTypes.has(row.paymentTypeId)) {
        continue;
      }
      seenTypes.add(row.paymentTypeId);
      const seenCharges = new Set<number>();
      const chargeIds = (row.chargeIds ?? []).filter((id) => {
        if (seenCharges.has(id)) {
          return false;
        }
        seenCharges.add(id);
        return true;
      });
      channels.push({
        ...row,
        chargeIds,
        chargeAmounts: pruneProductChargeAmounts(chargeIds, row.chargeAmounts)
      });
    }
    onChange({ channels });
  }

  function update(paymentTypeId: number, patch: Partial<ChannelRow>) {
    write(
      channels.map((row) => (row.paymentTypeId === paymentTypeId ? { ...row, ...patch } : row))
    );
  }

  function toggleIncluded(paymentTypeId: number, checked: boolean) {
    if (!checked) {
      write(channels.filter((row) => row.paymentTypeId !== paymentTypeId));
      return;
    }
    if (byTypeId.has(paymentTypeId)) {
      return;
    }
    write([
      ...channels,
      { paymentTypeId, isPremium: false, isActive: true, chargeIds: [], chargeAmounts: {} }
    ]);
  }

  function togglePremium(paymentTypeId: number, isPremium: boolean) {
    const row = byTypeId.get(paymentTypeId);
    if (!row) {
      return;
    }
    update(paymentTypeId, {
      isPremium,
      chargeIds: isPremium ? row.chargeIds : [],
      chargeAmounts: isPremium ? row.chargeAmounts : {}
    });
  }

  function toggleCharge(paymentTypeId: number, chargeId: number, checked: boolean) {
    const row = byTypeId.get(paymentTypeId);
    if (!row) {
      return;
    }
    const nextIds = new Set(row.chargeIds ?? []);
    if (checked) {
      nextIds.add(chargeId);
    } else {
      nextIds.delete(chargeId);
    }
    const chargeIds = [...nextIds];
    update(paymentTypeId, {
      chargeIds,
      chargeAmounts: pruneProductChargeAmounts(chargeIds, row.chargeAmounts)
    });
  }

  function setChargeAmount(paymentTypeId: number, chargeId: number, amount: number | undefined) {
    const row = byTypeId.get(paymentTypeId);
    if (!row) {
      return;
    }
    const next = { ...(row.chargeAmounts ?? {}) };
    if (amount == null) {
      delete next[String(chargeId)];
    } else {
      next[String(chargeId)] = amount;
    }
    update(paymentTypeId, { chargeAmounts: next });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose which payment types this product allows. Each payment type can be included once.
        Leave the list empty to keep every payment type available. Standard channels can always be
        used for deposits and withdrawals. Premium channels need an account subscription, and any
        fees you map here are added when the account subscribes. Each fee can be mapped once on a
        channel. Those fees are separate from the product fees on the previous step.
      </p>

      {catalogOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment types are available.</p>
      ) : (
        <DetailSection title="Payment channels">
          <ul className="space-y-2">
            {catalogOptions.map((option) => {
              const row = byTypeId.get(option.id);
              const included = row != null;
              const controlId = `payment-channel-${option.id}`;
              const label = fineractOptionLabel(option);

              return (
                <li key={option.id}>
                  <div
                    className={cn(
                      'rounded-lg border border-input px-3 py-2.5',
                      included && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <label htmlFor={controlId} className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        id={controlId}
                        className="mt-0.5"
                        checked={included}
                        onCheckedChange={(checked) => toggleIncluded(option.id, checked === true)}
                      />
                      <span className="min-w-0 flex-1 text-sm leading-snug">{label}</span>
                    </label>

                    {row ? (
                      <div className="mt-3 space-y-4 pl-8">
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`${controlId}-premium`}
                              checked={row.isPremium}
                              onCheckedChange={(checked) => togglePremium(option.id, checked)}
                            />
                            <Label htmlFor={`${controlId}-premium`}>Premium</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`${controlId}-active`}
                              checked={row.isActive}
                              onCheckedChange={(checked) =>
                                update(option.id, { isActive: checked })
                              }
                            />
                            <Label htmlFor={`${controlId}-active`}>Active</Label>
                          </div>
                        </div>

                        {row.isPremium ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Optional fees added when an account subscribes. Amount overrides are
                              hidden for tiered charges.
                            </p>
                            {!currencyCode ? (
                              <p className="text-sm text-muted-foreground">
                                Select a currency before mapping fees.
                              </p>
                            ) : (
                              <ProductChargeCheckboxList
                                options={feeOptions}
                                selected={new Set(row.chargeIds ?? [])}
                                chargeAmounts={row.chargeAmounts}
                                idPrefix={`${controlId}-fees`}
                                currencyCode={currencyCode}
                                onToggle={(id, checked) => toggleCharge(option.id, id, checked)}
                                onAmountChange={(id, amount) =>
                                  setChargeAmount(option.id, id, amount)
                                }
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Standard channels are allowed on every account. No subscription or
                            channel fee.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {stepError ? <p className="mt-3 text-sm text-destructive">{stepError}</p> : null}
        </DetailSection>
      )}
    </div>
  );
}

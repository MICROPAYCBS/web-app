'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { amountsEqualForCurrency, sumLegalTenderLines } from '@mifos/validation';
import Decimal from 'decimal.js';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export type LegalTenderQuantityMap = Record<number, string>;

export function emptyLegalTenderQuantities(tenders: CurrencyLegalTender[]): LegalTenderQuantityMap {
  return Object.fromEntries(tenders.map((tender) => [tender.id, '']));
}

export function buildLegalTenderLines(
  tenders: CurrencyLegalTender[],
  quantities: LegalTenderQuantityMap
): { legalTenderId: number; quantity: number }[] {
  return tenders
    .map((tender) => ({
      legalTenderId: tender.id,
      quantity: Number.parseInt(quantities[tender.id] ?? '0', 10) || 0
    }))
    .filter((line) => line.quantity > 0);
}

export function computeLegalTenderTotal(
  tenders: CurrencyLegalTender[],
  quantities: LegalTenderQuantityMap
): Decimal {
  const tenderById = new Map(tenders.map((tender) => [tender.id, tender]));
  return sumLegalTenderLines(buildLegalTenderLines(tenders, quantities), tenderById);
}

function groupTenders(tenders: CurrencyLegalTender[]) {
  return {
    notes: tenders.filter((tender) => tender.tenderType === 'NOTE'),
    coins: tenders.filter((tender) => tender.tenderType === 'COIN')
  };
}

function LegalTenderSection({
  title,
  tenders,
  currencyCode,
  quantities,
  onQuantityChange,
  disabled
}: {
  title: string;
  tenders: CurrencyLegalTender[];
  currencyCode: string;
  quantities: LegalTenderQuantityMap;
  onQuantityChange: (legalTenderId: number, value: string) => void;
  disabled?: boolean;
}) {
  if (tenders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_5.5rem_minmax(0,0.9fr)] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>Label</span>
          <span>Face value</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Line total</span>
        </div>
        {tenders.map((tender) => {
          const quantity = Number.parseInt(quantities[tender.id] ?? '0', 10) || 0;
          const lineTotal = new Decimal(tender.value).times(quantity);
          return (
            <div
              key={tender.id}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_5.5rem_minmax(0,0.9fr)] items-center gap-2 border-b border-border px-3 py-2 last:border-b-0"
            >
              <span className="text-sm">{tender.label}</span>
              <span className="text-sm text-muted-foreground">
                {formatMoney(tender.value, currencyCode, FINERACT_LOCALE) ?? tender.value}
              </span>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label={`${tender.label} quantity`}
                value={quantities[tender.id] ?? ''}
                onChange={(event) =>
                  onQuantityChange(tender.id, event.target.value.replace(/[^\d]/g, ''))
                }
                disabled={disabled}
                className="h-8 w-full tabular-nums"
              />
              <span className="text-right text-sm">
                {quantity > 0
                  ? formatMoney(lineTotal, currencyCode, FINERACT_LOCALE) ?? lineTotal.toString()
                  : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CashierLegalTenderGrid({
  currencyCode,
  decimalPlaces,
  tenders,
  quantities,
  onQuantitiesChange,
  disabled,
  emptyMessage
}: {
  currencyCode: string;
  decimalPlaces: number;
  tenders: CurrencyLegalTender[];
  quantities: LegalTenderQuantityMap;
  onQuantitiesChange: (next: LegalTenderQuantityMap) => void;
  disabled?: boolean;
  emptyMessage?: React.ReactNode;
}) {
  const grouped = useMemo(() => groupTenders(tenders), [tenders]);
  const total = useMemo(
    () => computeLegalTenderTotal(tenders, quantities),
    [quantities, tenders]
  );
  const hasPositiveQuantity = useMemo(
    () => buildLegalTenderLines(tenders, quantities).length > 0,
    [quantities, tenders]
  );

  function handleQuantityChange(legalTenderId: number, value: string) {
    onQuantitiesChange({
      ...quantities,
      [legalTenderId]: value.replace(/[^\d]/g, '')
    });
  }

  function handleClear() {
    onQuantitiesChange(emptyLegalTenderQuantities(tenders));
  }

  if (tenders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {emptyMessage ?? (
          <>
            No legal tender denominations are configured for {currencyCode}. Set them up under
            Organization → Legal tenders before allocating or settling cash.
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Count physical notes and coins. The transaction total is calculated from these counts.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={disabled}>
          Clear counts
        </Button>
      </div>

      <LegalTenderSection
        title="Notes"
        tenders={grouped.notes}
        currencyCode={currencyCode}
        quantities={quantities}
        onQuantityChange={handleQuantityChange}
        disabled={disabled}
      />
      <LegalTenderSection
        title="Coins"
        tenders={grouped.coins}
        currencyCode={currencyCode}
        quantities={quantities}
        onQuantityChange={handleQuantityChange}
        disabled={disabled}
      />

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">Total</span>
        <span className="text-sm font-semibold">
          {hasPositiveQuantity
            ? formatMoney(total, currencyCode, FINERACT_LOCALE) ?? total.toString()
            : '—'}
        </span>
      </div>
    </div>
  );
}

export function legalTenderTotalIsValid(
  tenders: CurrencyLegalTender[],
  quantities: LegalTenderQuantityMap,
  decimalPlaces: number
): boolean {
  const lines = buildLegalTenderLines(tenders, quantities);
  if (lines.length === 0) {
    return false;
  }
  const total = computeLegalTenderTotal(tenders, quantities);
  return total.gt(0) && amountsEqualForCurrency(total, total, decimalPlaces);
}

export function legalTenderTotalAmount(
  tenders: CurrencyLegalTender[],
  quantities: LegalTenderQuantityMap,
  decimalPlaces: number
): number {
  return computeLegalTenderTotal(tenders, quantities)
    .toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Decimal from 'decimal.js';

export interface LegalTenderLineInput {
  legalTenderId: number;
  quantity: number;
}

export interface LegalTenderMasterRow {
  id: number;
  value: number;
  active?: boolean;
}

export function sumLegalTenderLines(
  lines: LegalTenderLineInput[],
  tenderById: Map<number, LegalTenderMasterRow>
): Decimal {
  let total = new Decimal(0);
  for (const line of lines) {
    const tender = tenderById.get(line.legalTenderId);
    if (!tender) {
      continue;
    }
    total = total.plus(new Decimal(tender.value).times(line.quantity));
  }
  return total;
}

export function roundAmountForCurrency(amount: Decimal, decimalPlaces: number): Decimal {
  return amount.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
}

export function amountsEqualForCurrency(
  left: Decimal | number,
  right: Decimal | number,
  decimalPlaces: number
): boolean {
  const a = roundAmountForCurrency(new Decimal(left), decimalPlaces);
  const b = roundAmountForCurrency(new Decimal(right), decimalPlaces);
  return a.equals(b);
}

export function findDuplicateLegalTenderIds(lines: LegalTenderLineInput[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const line of lines) {
    if (seen.has(line.legalTenderId)) {
      duplicates.add(line.legalTenderId);
    }
    seen.add(line.legalTenderId);
  }
  return [...duplicates];
}

export function hasPositiveLegalTenderQuantity(lines: LegalTenderLineInput[]): boolean {
  return lines.some((line) => line.quantity > 0);
}

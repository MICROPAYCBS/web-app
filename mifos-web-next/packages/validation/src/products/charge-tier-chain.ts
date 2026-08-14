/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Lookup band: [from, to), last to is always null (open-ended). */
export type ChargeTierChainRow = {
  amountRangeFrom: number;
  amountRangeTo: number | null;
  amount: number;
};

/**
 * First from is 0, each next from equals previous to, last to is blank.
 * Call after edit or delete so bands stay contiguous (no gaps or overlaps).
 */
export function rechainChargeTiers<T extends ChargeTierChainRow>(tiers: T[]): T[] {
  if (tiers.length === 0) {
    return [];
  }
  const next = tiers.map((tier) => ({ ...tier }));
  next[0].amountRangeFrom = 0;
  for (let index = 1; index < next.length; index++) {
    const previousTo = next[index - 1].amountRangeTo;
    if (previousTo != null) {
      next[index].amountRangeFrom = previousTo;
    }
  }
  next[next.length - 1].amountRangeTo = null;
  return next;
}

/**
 * Close the current last band at `from` and append a new open-ended last band.
 * The first band always starts at 0.
 */
export function appendOpenEndedChargeTier<T extends ChargeTierChainRow>(
  tiers: T[],
  from: number,
  amount: number
): T[] {
  if (tiers.length === 0) {
    return [{ amountRangeFrom: 0, amountRangeTo: null, amount } as T];
  }
  const next = tiers.map((tier) => ({ ...tier }));
  next[next.length - 1].amountRangeTo = from;
  next.push({ amountRangeFrom: from, amountRangeTo: null, amount } as T);
  return rechainChargeTiers(next);
}

export function replaceChargeTierAndRechain<T extends ChargeTierChainRow>(
  tiers: T[],
  index: number,
  tier: T
): T[] {
  return rechainChargeTiers(tiers.map((row, i) => (i === index ? tier : row)));
}

export function removeChargeTierAndRechain<T extends ChargeTierChainRow>(
  tiers: T[],
  index: number
): T[] {
  return rechainChargeTiers(tiers.filter((_, i) => i !== index));
}

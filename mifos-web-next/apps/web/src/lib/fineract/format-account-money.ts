/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Display helper until @mifos/domain formatMoney is wired for detail tables. */
export function formatAccountMoney(amount: number | undefined, currencyCode?: string): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  const code = (currencyCode ?? '').trim().toUpperCase();
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return code ? `${code} ${formatted}` : formatted;
}

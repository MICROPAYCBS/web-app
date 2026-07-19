/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';

export function collateralProductCurrencyCode(
  currency?: FineractCurrencyOption | string
): string | undefined {
  if (typeof currency === 'string') {
    return currency;
  }
  return currency?.code;
}

export function collateralProductCurrencyLabel(
  currency?: FineractCurrencyOption | string
): string {
  if (typeof currency === 'string') {
    return currency;
  }
  if (currency?.name && currency.code) {
    return `${currency.name} (${currency.code})`;
  }
  return currency?.code ?? currency?.name ?? '—';
}

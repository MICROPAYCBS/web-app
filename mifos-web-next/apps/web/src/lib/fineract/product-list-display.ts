/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '@mifos/api-client';
import { accountingRuleLabel } from '@/lib/fineract/product-display';

export function productListCurrencyCode(item: {
  currencyCode?: string;
  currency?: FineractCurrencyOption | string;
}): string {
  if (item.currencyCode?.trim()) {
    return item.currencyCode.trim();
  }
  if (typeof item.currency === 'string' && item.currency.trim()) {
    return item.currency.trim();
  }
  return typeof item.currency === 'object' ? (item.currency?.code ?? '—') : '—';
}

export function productListAccountingLabel(rule?: FineractEnumOption): string {
  return accountingRuleLabel(rule);
}

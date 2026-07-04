/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DashboardCurrencyOption } from '@/lib/dashboard/analytics-types';

/** Fineract stretchy reports use currency code; `-1` means all currencies (avoid for dashboard totals). */
export function resolveDashboardReportCurrencyId(currencyCode: string | null | undefined): string {
  const code = currencyCode?.trim().toUpperCase();
  return code ? code : '-1';
}

export function parseDashboardCurrencyCode(
  raw: string | null | undefined,
  allowed: DashboardCurrencyOption[]
): string | null {
  const normalized = raw?.trim().toUpperCase();
  if (!normalized) {
    return allowed[0]?.code ?? null;
  }

  const match = allowed.find((currency) => currency.code.toUpperCase() === normalized);
  return match?.code ?? allowed[0]?.code ?? null;
}

export function mapOrganizationCurrencies(
  currencies: { code?: string; name?: string }[]
): DashboardCurrencyOption[] {
  return currencies
    .filter((currency): currency is { code: string; name?: string } => Boolean(currency.code?.trim()))
    .map((currency) => ({
      code: currency.code.trim().toUpperCase(),
      name: currency.name?.trim() || undefined
    }));
}

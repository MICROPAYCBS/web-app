import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  OrganizationCurrenciesConfiguration,
  OrganizationCurrenciesMutationResponse
} from '@mifos/api-client';
import type { UpdateOrganizationCurrenciesPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

function parseCurrencyOptions(value: unknown): FineractCurrencyOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const options: FineractCurrencyOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const code = typeof row.code === 'string' ? row.code : undefined;
    if (!code) {
      continue;
    }
    options.push({
      code,
      name: typeof row.name === 'string' ? row.name : undefined,
      decimalPlaces:
        typeof row.decimalPlaces === 'number' ? row.decimalPlaces : undefined
    });
  }
  return options;
}

/** Full currency configuration (`GET /currencies`). */
export async function getOrganizationCurrenciesConfiguration(): Promise<OrganizationCurrenciesConfiguration> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/currencies');
  if (!raw || typeof raw !== 'object') {
    return { selectedCurrencyOptions: [], currencyOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  return {
    selectedCurrencyOptions: parseCurrencyOptions(row.selectedCurrencyOptions),
    currencyOptions: parseCurrencyOptions(row.currencyOptions)
  };
}

/** Currencies enabled for the organization (`GET /currencies`). */
export async function getOrganizationSelectedCurrencies(): Promise<FineractCurrencyOption[]> {
  const configuration = await getOrganizationCurrenciesConfiguration();
  return configuration.selectedCurrencyOptions;
}

/** First selected organization currency — used as the default for cashier summaries. */
export async function getDefaultOrganizationCurrencyCode(): Promise<string | undefined> {
  const selected = await getOrganizationSelectedCurrencies();
  return selected[0]?.code;
}

export async function updateOrganizationCurrencies(
  input: UpdateOrganizationCurrenciesPayload
): Promise<OrganizationCurrenciesMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<OrganizationCurrenciesMutationResponse>('/currencies', input);
}

export function filterCurrencyOptionsBySelected(
  options: FineractCurrencyOption[],
  selectedCurrencies: FineractCurrencyOption[],
  includeCode?: string
): FineractCurrencyOption[] {
  const selectedCodes = new Set(
    selectedCurrencies
      .map((currency) => currency.code)
      .filter((code): code is string => Boolean(code))
  );

  const filtered = options.filter(
    (currency) => currency.code && selectedCodes.has(currency.code)
  );

  if (!includeCode || filtered.some((currency) => currency.code === includeCode)) {
    return filtered;
  }

  const preserved =
    selectedCurrencies.find((currency) => currency.code === includeCode) ??
    options.find((currency) => currency.code === includeCode) ??
    { code: includeCode };

  return [...filtered, preserved];
}

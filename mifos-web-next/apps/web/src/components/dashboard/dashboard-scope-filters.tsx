'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SelectField } from '@/components/composites/select-field';
import type {
  DashboardCurrencyOption,
  DashboardOfficeOption
} from '@/lib/dashboard/analytics-types';
import { cn } from '@/lib/utils';

export function DashboardScopeFilters({
  offices,
  currencies,
  officeId,
  currencyCode,
  onOfficeIdChange,
  onCurrencyCodeChange,
  disabled = false,
  className
}: {
  offices: DashboardOfficeOption[];
  currencies: DashboardCurrencyOption[];
  officeId: string;
  currencyCode: string;
  onOfficeIdChange: (officeId: string) => void;
  onCurrencyCodeChange: (currencyCode: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const showBranch = offices.length > 0;
  const showCurrency = currencies.length > 1;

  if (!showBranch && !showCurrency) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showBranch ? (
        <div className="min-w-[12rem]">
          <SelectField
            id="dashboard-scope-office"
            label="Branch"
            hideLabel
            value={officeId}
            onValueChange={(value) => value && onOfficeIdChange(value)}
            options={offices.map((office) => ({
              value: String(office.id),
              label: office.name
            }))}
            disabled={disabled}
          />
        </div>
      ) : null}
      {showCurrency ? (
        <div className="min-w-[10rem]">
          <SelectField
            id="dashboard-scope-currency"
            label="Currency"
            hideLabel
            value={currencyCode}
            onValueChange={(value) => value && onCurrencyCodeChange(value)}
            options={currencies.map((currency) => ({
              value: currency.code,
              label: currency.name ? `${currency.code} — ${currency.name}` : currency.code
            }))}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}

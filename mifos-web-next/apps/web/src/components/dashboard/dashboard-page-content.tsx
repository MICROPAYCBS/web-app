'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useState } from 'react';
import { DashboardKpiSection } from '@/components/dashboard/dashboard-kpi-section';
import { DashboardScopeFilters } from '@/components/dashboard/dashboard-scope-filters';
import { APP_NAME } from '@/lib/branding';
import type { DashboardCurrencyOption, DashboardOfficeOption } from '@/lib/dashboard/analytics-types';
import type { DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';
import { platformScrollRegion } from '@/lib/platform-layout';

export function DashboardPageContent({
  offices,
  currencies,
  defaultOfficeId,
  defaultCurrencyCode,
  initialKpis,
  showKpis,
  permissions
}: {
  offices: DashboardOfficeOption[];
  currencies: DashboardCurrencyOption[];
  defaultOfficeId: number | null;
  defaultCurrencyCode: string | null;
  initialKpis: DashboardKpis;
  showKpis: boolean;
  permissions: {
    clients: boolean;
    loans: boolean;
    savings: boolean;
    reports: boolean;
    checker: boolean;
    collections: boolean;
    cashier: boolean;
  };
}) {
  const [officeId, setOfficeId] = useState(
    defaultOfficeId != null ? String(defaultOfficeId) : ''
  );
  const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode ?? '');

  const handleOfficeIdChange = useCallback((nextOfficeId: string) => {
    setOfficeId(nextOfficeId);
  }, []);

  const handleCurrencyCodeChange = useCallback((nextCurrencyCode: string) => {
    setCurrencyCode(nextCurrencyCode);
  }, []);

  if (!showKpis) {
    return (
      <div className={platformScrollRegion}>
        <p className="px-4 py-6 text-sm text-muted-foreground lg:px-6">
          No dashboard metrics are available for your role.
        </p>
      </div>
    );
  }

  return (
    <div className={platformScrollRegion}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="space-y-2 px-4 lg:px-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to {APP_NAME}.</p>
          <p className="text-sm text-muted-foreground">
            Portfolio KPIs for the selected branch and its sub-branches
            {currencyCode ? ` in ${currencyCode}` : ''}. Select a card to open the related screen.
          </p>
        </div>

        <DashboardKpiSection
          officeId={officeId}
          currencyCode={currencyCode}
          initialKpis={initialKpis}
          permissions={permissions}
          className="px-4 lg:px-6"
          filtersSlot={
            <DashboardScopeFilters
              offices={offices}
              currencies={currencies}
              officeId={officeId}
              currencyCode={currencyCode}
              onOfficeIdChange={handleOfficeIdChange}
              onCurrencyCodeChange={handleCurrencyCodeChange}
            />
          }
        />
      </div>
    </div>
  );
}

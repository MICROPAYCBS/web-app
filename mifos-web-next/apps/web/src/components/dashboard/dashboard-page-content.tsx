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
      <div className="py-4 md:py-6">
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

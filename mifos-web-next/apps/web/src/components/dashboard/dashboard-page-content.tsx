'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { TextField } from '@/components/composites/text-field';
import { DashboardAnalyticsSection } from '@/components/dashboard/dashboard-analytics-section';
import { DashboardKpiSection } from '@/components/dashboard/dashboard-kpi-section';
import { DashboardScopeFilters } from '@/components/dashboard/dashboard-scope-filters';
import { NavIcon } from '@/components/platform/nav-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/lib/branding';
import type {
  DashboardActivity,
  DashboardShortcut
} from '@/lib/dashboard/dashboard-activities';
import type {
  DashboardAnalytics,
  DashboardCurrencyOption,
  DashboardOfficeOption
} from '@/lib/dashboard/analytics-types';
import type { DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';
import { platformScrollRegion } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

const ACTIVITY_PREVIEW_LIMIT = 8;

export function DashboardPageContent({
  activities,
  shortcuts,
  offices,
  currencies,
  defaultOfficeId,
  defaultCurrencyCode,
  initialKpis,
  initialAnalytics,
  showKpis,
  showAnalytics,
  permissions
}: {
  activities: DashboardActivity[];
  shortcuts: DashboardShortcut[];
  offices: DashboardOfficeOption[];
  currencies: DashboardCurrencyOption[];
  defaultOfficeId: number | null;
  defaultCurrencyCode: string | null;
  initialKpis: DashboardKpis;
  initialAnalytics: DashboardAnalytics | null;
  showKpis: boolean;
  showAnalytics: boolean;
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
  const [query, setQuery] = useState('');
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

  const filteredActivities = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return activities.slice(0, ACTIVITY_PREVIEW_LIMIT);
    }
    return activities
      .filter(
        (activity) =>
          activity.label.toLowerCase().includes(normalized) ||
          activity.searchText.includes(normalized)
      )
      .slice(0, ACTIVITY_PREVIEW_LIMIT);
  }, [activities, query]);

  return (
    <div className={platformScrollRegion}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="space-y-2 px-4 lg:px-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to {APP_NAME}. Review portfolio KPIs, reports, and jump to any screen.
          </p>
        </div>

        {showKpis || showAnalytics ? (
          <DashboardScopeFilters
            offices={offices}
            currencies={currencies}
            officeId={officeId}
            currencyCode={currencyCode}
            onOfficeIdChange={handleOfficeIdChange}
            onCurrencyCodeChange={handleCurrencyCodeChange}
            className="px-4 lg:px-6"
          />
        ) : null}

        {showKpis ? (
          <DashboardKpiSection
            officeId={officeId}
            currencyCode={currencyCode}
            initialKpis={initialKpis}
            permissions={permissions}
            className="px-4 lg:px-6"
          />
        ) : null}

        {showAnalytics && defaultOfficeId != null && initialAnalytics ? (
          <section className="space-y-4 px-4 lg:px-6">
            <div>
              <h2 className="text-lg font-medium">Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Collection, disbursement, and trend reports for the selected branch
                {currencyCode ? ` in ${currencyCode}` : ''}.
              </p>
            </div>
            <DashboardAnalyticsSection
              officeId={officeId}
              currencyCode={currencyCode}
              initialAnalytics={initialAnalytics}
            />
          </section>
        ) : null}

        <div className="px-4 lg:px-6">
          <Card>
          <CardHeader>
            <CardTitle>Search activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              id="dashboard-activity-search"
              label="Activity"
              value={query}
              onChange={setQuery}
              placeholder="Type to find a screen (e.g. clients, journal, holidays)"
            />
            {filteredActivities.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {filteredActivities.map((activity) => (
                  <li key={activity.id}>
                    <Link
                      href={activity.path}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/40"
                    >
                      <span>{activity.label}</span>
                      <span className="text-muted-foreground">{activity.path}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No matching screens.</p>
            )}
          </CardContent>
          </Card>
        </div>

        {shortcuts.length > 0 ? (
          <div className="space-y-3 px-4 lg:px-6">
            <h2 className="text-lg font-medium">Shortcuts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shortcuts.map((shortcut) => (
                <Link
                  key={shortcut.id}
                  href={shortcut.path}
                  className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    {shortcut.icon ? (
                      <NavIcon name={shortcut.icon} className="size-5 text-muted-foreground" />
                    ) : null}
                    <h3 className="font-medium">{shortcut.label}</h3>
                  </div>
                  <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
                    Open
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

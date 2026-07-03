'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DetailSummary } from '@/components/composites/detail/detail-summary';
import { TextField } from '@/components/composites/text-field';
import { DashboardAnalyticsSection } from '@/components/dashboard/dashboard-analytics-section';
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
  DashboardOfficeOption
} from '@/lib/dashboard/analytics-types';
import type { DashboardCounts } from '@/lib/fineract/dashboard-counts';
import { platformInset, platformScrollRegion } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

const ACTIVITY_PREVIEW_LIMIT = 8;

export function DashboardPageContent({
  activities,
  shortcuts,
  counts,
  offices,
  defaultOfficeId,
  initialAnalytics,
  showAnalytics
}: {
  activities: DashboardActivity[];
  shortcuts: DashboardShortcut[];
  counts: DashboardCounts;
  offices: DashboardOfficeOption[];
  defaultOfficeId: number | null;
  initialAnalytics: DashboardAnalytics | null;
  showAnalytics: boolean;
}) {
  const [query, setQuery] = useState('');

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

  const summaryItems = [
    counts.clients != null
      ? {
          id: 'clients',
          label: 'Customers',
          value: (
            <Link href="/clients" className="font-semibold tabular-nums hover:underline">
              {counts.clients.toLocaleString()}
            </Link>
          )
        }
      : null,
    counts.loans != null
      ? {
          id: 'loans',
          label: 'Loan accounts',
          value: (
            <Link href="/loans" className="font-semibold tabular-nums hover:underline">
              {counts.loans.toLocaleString()}
            </Link>
          )
        }
      : null,
    counts.savings != null
      ? {
          id: 'savings',
          label: 'Savings accounts',
          value: (
            <Link href="/savings" className="font-semibold tabular-nums hover:underline">
              {counts.savings.toLocaleString()}
            </Link>
          )
        }
      : null
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className={platformScrollRegion}>
      <div className={cn(platformInset, 'mx-auto max-w-5xl space-y-8')}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to {APP_NAME}. Review portfolio totals, reports, and jump to any screen.
          </p>
        </div>

        {summaryItems.length > 0 ? <DetailSummary items={summaryItems} /> : null}

        {showAnalytics && defaultOfficeId != null && initialAnalytics ? (
          <DashboardAnalyticsSection
            offices={offices}
            defaultOfficeId={defaultOfficeId}
            initialAnalytics={initialAnalytics}
          />
        ) : null}

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

        {shortcuts.length > 0 ? (
          <div className="space-y-3">
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

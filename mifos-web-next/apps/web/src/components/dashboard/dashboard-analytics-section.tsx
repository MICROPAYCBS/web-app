'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { DetailSummary } from '@/components/composites/detail/detail-summary';
import { SelectField } from '@/components/composites/select-field';
import {
  DashboardAmountPieChart,
  DashboardTrendsChart
} from '@/components/dashboard/dashboard-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { isAnalyticsEmpty } from '@/lib/dashboard/analytics-parse';
import type {
  DashboardAnalytics,
  DashboardOfficeOption,
  DashboardTimescale
} from '@/lib/dashboard/analytics-types';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function DashboardAnalyticsSection({
  offices,
  defaultOfficeId,
  initialAnalytics
}: {
  offices: DashboardOfficeOption[];
  defaultOfficeId: number;
  initialAnalytics: DashboardAnalytics;
}) {
  const [officeId, setOfficeId] = useState(String(defaultOfficeId));
  const [timescale, setTimescale] = useState<DashboardTimescale>('Month');
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);

  const loadAnalytics = useCallback(
    (nextOfficeId: string, nextTimescale: DashboardTimescale) => {
      startTransition(async () => {
        const params = new URLSearchParams({
          officeId: nextOfficeId,
          timescale: nextTimescale
        });
        const res = await fetch(`/api/dashboard/analytics?${params.toString()}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as DashboardAnalytics;
        setAnalytics(json);
      });
    },
    []
  );

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    loadAnalytics(officeId, timescale);
  }, [officeId, timescale, loadAnalytics]);

  const officeOptions = offices.map((office) => ({
    value: String(office.id),
    label: office.name
  }));

  const reportMetrics = [
    analytics.amountCollected != null
      ? {
          id: 'collected',
          label: 'Amount collected',
          value: (
            <span className="font-semibold tabular-nums">
              {formatAccountMoney(analytics.amountCollected)}
            </span>
          )
        }
      : null,
    analytics.amountDisbursed != null
      ? {
          id: 'disbursed',
          label: 'Amount disbursed',
          value: (
            <span className="font-semibold tabular-nums">
              {formatAccountMoney(analytics.amountDisbursed)}
            </span>
          )
        }
      : null
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const showEmpty = !pending && isAnalyticsEmpty(analytics);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SelectField
          id="dashboard-office"
          label="Branch"
          value={officeId}
          onValueChange={(value) => setOfficeId(value ?? officeId)}
          options={officeOptions}
          disabled={pending || officeOptions.length === 0}
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            value={[timescale]}
            onValueChange={(values) => {
              const next = values[0];
              if (next === 'Day' || next === 'Week' || next === 'Month') {
                setTimescale(next);
              }
            }}
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label="Trend period"
          >
            <ToggleGroupItem value="Day">Day</ToggleGroupItem>
            <ToggleGroupItem value="Week">Week</ToggleGroupItem>
            <ToggleGroupItem value="Month">Month</ToggleGroupItem>
          </ToggleGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => loadAnalytics(officeId, timescale)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {reportMetrics.length > 0 ? <DetailSummary items={reportMetrics} /> : null}

      {showEmpty ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No report data for this branch and period.
          </CardContent>
        </Card>
      ) : (
        <>
          {analytics.trends && analytics.trends.length > 0 ? (
            <DashboardTrendsChart data={analytics.trends} />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {analytics.collectionBreakdown ? (
              <DashboardAmountPieChart
                title="Collection breakdown"
                completeLabel="Collected"
                pending={analytics.collectionBreakdown.pending}
                complete={analytics.collectionBreakdown.complete}
              />
            ) : null}
            {analytics.disbursementBreakdown ? (
              <DashboardAmountPieChart
                title="Disbursement breakdown"
                completeLabel="Disbursed"
                pending={analytics.disbursementBreakdown.pending}
                complete={analytics.disbursementBreakdown.complete}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

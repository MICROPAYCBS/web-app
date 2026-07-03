'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardTrendPoint } from '@/lib/dashboard/analytics-types';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

const trendsChartConfig = {
  clients: { label: 'Customers', color: 'var(--chart-1)' },
  loans: { label: 'Loans', color: 'var(--chart-2)' }
} satisfies ChartConfig;

export function DashboardTrendsChart({ data }: { data: DashboardTrendPoint[] }) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer and loan trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendsChartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={56}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="clients" fill="var(--color-clients)" radius={4} />
            <Bar dataKey="loans" fill="var(--color-loans)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const amountChartConfig = {
  pending: { label: 'Pending', color: 'var(--chart-3)' },
  complete: { label: 'Complete', color: 'var(--chart-4)' }
} satisfies ChartConfig;

export function DashboardAmountPieChart({
  title,
  completeLabel,
  pending,
  complete
}: {
  title: string;
  completeLabel: string;
  pending: number;
  complete: number;
}) {
  const data = [
    { name: 'pending', value: pending, label: 'Pending' },
    { name: 'complete', value: complete, label: completeLabel }
  ];

  if (pending === 0 && complete === 0) {
    return null;
  }

  const config = {
    ...amountChartConfig,
    complete: { ...amountChartConfig.complete, label: completeLabel }
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={config} className="mx-auto aspect-square h-[220px] max-w-[280px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatAccountMoney(Number(value))}
                />
              }
            />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
              <Cell fill="var(--color-pending)" />
              <Cell fill="var(--color-complete)" />
            </Pie>
          </PieChart>
        </ChartContainer>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Pending</dt>
            <dd className="font-medium tabular-nums">{formatAccountMoney(pending)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{completeLabel}</dt>
            <dd className="font-medium tabular-nums">{formatAccountMoney(complete)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

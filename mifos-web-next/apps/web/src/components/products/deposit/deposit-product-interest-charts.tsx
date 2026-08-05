'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DepositProductDetail,
  DepositProductInterestChart,
  DepositProductInterestChartSlab
} from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  EmptyState
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DateValue } from '@/components/composites/detail/date-value';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import {
  depositProductCharts,
  formatChartSlabAmountRange,
  formatChartSlabPeriod
} from '@/lib/fineract/deposit-product-charts';

const slabColumns: ColumnDef<DepositProductInterestChartSlab>[] = [
  {
    id: 'period',
    header: 'Period',
    cell: ({ row }) => formatChartSlabPeriod(row.original)
  },
  {
    id: 'amountRange',
    header: 'Amount range',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatChartSlabAmountRange(row.original)}</span>
    )
  },
  {
    id: 'annualInterestRate',
    header: () => <span className="block w-full text-right">Interest %</span>,
    cell: ({ row }) => (
      <span className="block w-full text-right tabular-nums">
        {row.original.annualInterestRate != null ? `${row.original.annualInterestRate}` : '—'}
      </span>
    )
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description?.trim() || '—'
  }
];

function ChartSlabsTable({ slabs }: { slabs: DepositProductInterestChartSlab[] }) {
  const table = useReactTable({
    data: slabs,
    columns: slabColumns,
    getCoreRowModel: getCoreRowModel()
  });

  if (slabs.length === 0) {
    return <p className="text-sm text-muted-foreground">No rate slabs on this chart.</p>;
  }

  return <DataTable table={table} stickyHeader={false} />;
}

function ChartIncentives({ slabs }: { slabs: DepositProductInterestChartSlab[] }) {
  const rows = slabs.flatMap((slab, slabIndex) =>
    (slab.incentives ?? []).map((incentive, incentiveIndex) => ({
      key: `${slab.id ?? slabIndex}-${incentiveIndex}`,
      slabLabel: formatChartSlabPeriod(slab),
      incentive
    }))
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Incentives</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Slab</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Attribute</th>
              <th className="px-3 py-2 font-medium">Condition</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, slabLabel, incentive }) => (
              <tr key={key} className="border-t border-border">
                <td className="px-3 py-2">{slabLabel}</td>
                <td className="px-3 py-2">{enumOptionLabel(incentive.entityType) ?? '—'}</td>
                <td className="px-3 py-2">{enumOptionLabel(incentive.attributeName) ?? '—'}</td>
                <td className="px-3 py-2">{enumOptionLabel(incentive.conditionType) ?? '—'}</td>
                <td className="px-3 py-2">{incentive.attributeValue?.trim() || '—'}</td>
                <td className="px-3 py-2">{enumOptionLabel(incentive.incentiveType) ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {incentive.amount != null ? incentive.amount : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InterestChartCard({
  chart,
  index,
  total
}: {
  chart: DepositProductInterestChart;
  index: number;
  total: number;
}) {
  const slabs = chart.chartSlabs ?? [];
  const title =
    chart.name?.trim() || (total > 1 ? `Chart ${index + 1}` : 'Interest rate chart');

  return (
    <DetailSection title={title}>
      <div className="space-y-4">
        <DetailFieldGrid>
          <DetailField label="Valid from">
            <DateValue value={chart.fromDate} />
          </DetailField>
          <DetailField label="End date">
            <DateValue value={chart.endDate} />
          </DetailField>
          <DetailField label="Primary grouping by amount">
            {formatYesNo(chart.isPrimaryGroupingByAmount)}
          </DetailField>
          {chart.description?.trim() ? (
            <DetailField label="Description" className="sm:col-span-2">
              {chart.description}
            </DetailField>
          ) : null}
        </DetailFieldGrid>

        <ChartSlabsTable slabs={slabs} />
        <ChartIncentives slabs={slabs} />
      </div>
    </DetailSection>
  );
}

export function DepositProductInterestCharts({ product }: { product: DepositProductDetail }) {
  const charts = depositProductCharts(product);

  if (charts.length === 0) {
    return (
      <DetailSection title="Interest rate chart">
        <EmptyState title="No interest rate charts configured on this product." />
      </DetailSection>
    );
  }

  return (
    <div className="space-y-6">
      {charts.map((chart, index) => (
        <InterestChartCard
          key={chart.id ?? `${chart.fromDate ?? 'chart'}-${index}`}
          chart={chart}
          index={index}
          total={charts.length}
        />
      ))}
    </div>
  );
}

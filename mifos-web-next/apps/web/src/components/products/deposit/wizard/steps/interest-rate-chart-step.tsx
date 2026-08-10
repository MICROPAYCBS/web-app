'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DepositProductChartDetailsInput,
  DepositProductChartInput,
  DepositProductChartSlabInput,
  DepositProductInterestRateChartInput
} from '@mifos/validation';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { fineractOptionLabel, toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';
import type { DepositProductStepProps } from '../types';
import {
  InterestRateChartFormSheet,
  PRIMARY_GROUPING_BY_AMOUNT_DESCRIPTION
} from './interest-rate-chart-form-sheet';
import { InterestRateSlabFormSheet } from './interest-rate-slab-form-sheet';

type Chart = DepositProductChartInput;
type Slab = DepositProductChartSlabInput;

type ChartSheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; chartIndex: number };

type SlabSheetState =
  | { mode: 'closed' }
  | { mode: 'create'; chartIndex: number }
  | { mode: 'edit'; chartIndex: number; slabIndex: number };

function defaultSlab(template: DepositProductStepProps['template']): Slab {
  const periodType = template.chartTemplate?.periodTypes?.[0]?.id;
  return {
    periodType,
    fromPeriod: undefined,
    annualInterestRate: undefined,
    description: 'Default',
    incentives: []
  };
}

function chartTitle(chart: Chart, index: number): string {
  return chart.name?.trim() || `Chart ${index + 1}`;
}

function formatSlabPeriod(
  slab: Slab,
  periodOptions: { id: number; name?: string; value?: string }[]
): string {
  if (slab.fromPeriod == null && slab.toPeriod == null) {
    return '—';
  }
  const option = periodOptions.find((item) => item.id === slab.periodType);
  const periodLabel = option ? fineractOptionLabel(option) : undefined;
  const range =
    slab.toPeriod != null ? `${slab.fromPeriod ?? '—'} – ${slab.toPeriod}` : String(slab.fromPeriod);
  return periodLabel ? `${range} ${periodLabel}` : range;
}

function formatSlabAmount(slab: Slab): string {
  if (slab.amountRangeFrom == null && slab.amountRangeTo == null) {
    return '—';
  }
  if (slab.amountRangeTo == null) {
    return String(slab.amountRangeFrom);
  }
  return `${slab.amountRangeFrom ?? '—'} – ${slab.amountRangeTo}`;
}

export function InterestRateChartStep({
  template,
  draft,
  errors,
  onChange
}: DepositProductStepProps & {
  onChange: (patch: Partial<DepositProductInterestRateChartInput>) => void;
}) {
  const charts = draft.interestRateChart.charts;
  const periodOptions = useMemo(
    () => toSelectOptions(template.chartTemplate?.periodTypes),
    [template.chartTemplate?.periodTypes]
  );
  const periodTypeOptions = template.chartTemplate?.periodTypes ?? [];
  const defaultPeriodType = periodTypeOptions[0]?.id;

  const [expandedCharts, setExpandedCharts] = useState<Record<number, boolean>>({ 0: true });
  const [chartSheet, setChartSheet] = useState<ChartSheetState>({ mode: 'closed' });
  const [slabSheet, setSlabSheet] = useState<SlabSheetState>({ mode: 'closed' });

  function updateCharts(next: Chart[]) {
    onChange({ charts: next });
  }

  function updateChart(index: number, patch: Partial<Chart>) {
    updateCharts(charts.map((chart, i) => (i === index ? { ...chart, ...patch } : chart)));
  }

  function removeChart(index: number) {
    if (charts.length <= 1) {
      return;
    }
    updateCharts(charts.filter((_, i) => i !== index));
    setExpandedCharts((current) => {
      const next: Record<number, boolean> = {};
      for (const [key, open] of Object.entries(current)) {
        const idx = Number(key);
        if (idx === index) {
          continue;
        }
        next[idx > index ? idx - 1 : idx] = open;
      }
      return next;
    });
  }

  function removeSlab(chartIndex: number, slabIndex: number) {
    const chart = charts[chartIndex];
    if (!chart || chart.chartSlabs.length <= 1) {
      return;
    }
    updateChart(chartIndex, {
      chartSlabs: chart.chartSlabs.filter((_, i) => i !== slabIndex)
    });
  }

  function handleSaveChart(details: DepositProductChartDetailsInput) {
    if (chartSheet.mode === 'edit') {
      updateChart(chartSheet.chartIndex, details);
      return;
    }
    const nextIndex = charts.length;
    updateCharts([
      ...charts,
      {
        ...details,
        chartSlabs: [defaultSlab(template)]
      }
    ]);
    setExpandedCharts((current) => ({ ...current, [nextIndex]: true }));
  }

  function handleSaveSlab(slab: Slab) {
    if (slabSheet.mode === 'closed') {
      return;
    }
    const chart = charts[slabSheet.chartIndex];
    if (!chart) {
      return;
    }
    if (slabSheet.mode === 'edit') {
      updateChart(slabSheet.chartIndex, {
        chartSlabs: chart.chartSlabs.map((row, i) =>
          i === slabSheet.slabIndex ? { ...slab, incentives: slab.incentives ?? [] } : row
        )
      });
      return;
    }
    updateChart(slabSheet.chartIndex, {
      chartSlabs: [...chart.chartSlabs, { ...slab, incentives: slab.incentives ?? [] }]
    });
  }

  const editingChart =
    chartSheet.mode === 'edit' ? charts[chartSheet.chartIndex] : undefined;
  const editingSlab =
    slabSheet.mode === 'edit'
      ? charts[slabSheet.chartIndex]?.chartSlabs[slabSheet.slabIndex]
      : undefined;
  const activeSlabChartIndex =
    slabSheet.mode === 'create' || slabSheet.mode === 'edit' ? slabSheet.chartIndex : 0;
  const activeSlabChart = charts[activeSlabChartIndex];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Add interest rate charts, then expand a chart to manage its rate slabs. Charts and slabs
          open in a side panel so the list stays easy to scan.
        </p>
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Primary grouping: </span>
          {PRIMARY_GROUPING_BY_AMOUNT_DESCRIPTION}
        </p>
      </div>

      {errors['interestRateChart.charts'] ? (
        <p className="text-sm text-destructive">{errors['interestRateChart.charts']}</p>
      ) : null}

      {charts.length === 0 ? (
        <EmptyState
          title="No interest rate charts yet"
          description="Add a chart to define when rates apply, then add slabs for term and amount ranges."
          action={
            <Button type="button" size="sm" onClick={() => setChartSheet({ mode: 'create' })}>
              <Plus className="mr-1 size-4" />
              Add chart
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {charts.map((chart, chartIndex) => {
            const open = expandedCharts[chartIndex] ?? false;
            const chartError =
              errors[`interestRateChart.charts.${chartIndex}.fromDate`] ||
              errors[`interestRateChart.charts.${chartIndex}.chartSlabs`];

            return (
              <Collapsible
                key={chart.id ?? chartIndex}
                open={open}
                onOpenChange={(next) =>
                  setExpandedCharts((current) => ({ ...current, [chartIndex]: next }))
                }
                className="rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <CollapsibleTrigger
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 rounded-md text-left text-sm hover:bg-muted/50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{chartTitle(chart, chartIndex)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {chart.fromDate || 'Valid from not set'}
                        {chart.endDate ? ` – ${chart.endDate}` : ''}
                        {' · '}
                        {chart.chartSlabs.length} slab
                        {chart.chartSlabs.length === 1 ? '' : 's'}
                        {' · '}
                        Group by amount: {formatYesNo(chart.isPrimaryGroupingByAmount)}
                      </span>
                    </span>
                  </CollapsibleTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartSheet({ mode: 'edit', chartIndex })}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit chart</span>
                  </Button>
                  {charts.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChart(chartIndex)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Remove chart</span>
                    </Button>
                  ) : null}
                </div>

                {chartError ? (
                  <p className="px-3 pb-2 text-sm text-destructive">{chartError}</p>
                ) : null}

                <CollapsibleContent className="border-t border-border px-3 py-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Rate slabs</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSlabSheet({ mode: 'create', chartIndex })}
                    >
                      <Plus className="mr-1 size-4" />
                      Add slab
                    </Button>
                  </div>

                  {chart.chartSlabs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slabs on this chart yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Period</th>
                            <th className="px-3 py-2 font-medium">Amount range</th>
                            <th className="px-3 py-2 text-right font-medium">Interest %</th>
                            <th className="px-3 py-2 font-medium">Description</th>
                            <th className="px-3 py-2 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chart.chartSlabs.map((slab, slabIndex) => {
                            const slabError =
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.periodType`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.fromPeriod`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.toPeriod`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.amountRangeFrom`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.amountRangeTo`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.annualInterestRate`
                              ] ||
                              errors[
                                `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.description`
                              ];

                            return (
                              <tr key={slab.id ?? slabIndex} className="border-t border-border">
                                <td className="px-3 py-2 align-top">
                                  {formatSlabPeriod(slab, periodTypeOptions)}
                                  {slabError ? (
                                    <p className="mt-1 text-xs text-destructive">{slabError}</p>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 align-top tabular-nums">
                                  {formatSlabAmount(slab)}
                                </td>
                                <td className="px-3 py-2 align-top text-right tabular-nums">
                                  {slab.annualInterestRate != null
                                    ? String(slab.annualInterestRate)
                                    : '—'}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  {slab.description?.trim() || '—'}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setSlabSheet({
                                          mode: 'edit',
                                          chartIndex,
                                          slabIndex
                                        })
                                      }
                                    >
                                      <Pencil className="size-4" />
                                      <span className="sr-only">Edit slab</span>
                                    </Button>
                                    {chart.chartSlabs.length > 1 ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSlab(chartIndex, slabIndex)}
                                      >
                                        <Trash2 className="size-4" />
                                        <span className="sr-only">Remove slab</span>
                                      </Button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      <Button type="button" variant="outline" onClick={() => setChartSheet({ mode: 'create' })}>
        <Plus className="mr-1 size-4" />
        Add chart
      </Button>

      <InterestRateChartFormSheet
        open={chartSheet.mode !== 'closed'}
        onOpenChange={(next) => {
          if (!next) {
            setChartSheet({ mode: 'closed' });
          }
        }}
        chart={editingChart}
        onSave={handleSaveChart}
      />

      <InterestRateSlabFormSheet
        open={slabSheet.mode !== 'closed'}
        onOpenChange={(next) => {
          if (!next) {
            setSlabSheet({ mode: 'closed' });
          }
        }}
        slab={editingSlab}
        periodOptions={periodOptions}
        defaultPeriodType={defaultPeriodType}
        primaryGroupingByAmount={activeSlabChart?.isPrimaryGroupingByAmount ?? false}
        onSave={handleSaveSlab}
      />
    </div>
  );
}

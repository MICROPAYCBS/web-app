'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DepositProductInterestRateChartInput,
} from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { DateField } from '@/components/composites/date-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toSelectOptions } from '@/lib/form/select-options';
import { Plus, Trash2 } from 'lucide-react';
import type { DepositProductStepProps } from '../types';

type Chart = DepositProductInterestRateChartInput['charts'][number];
type Slab = Chart['chartSlabs'][number];

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

function defaultChart(template: DepositProductStepProps['template']): Chart {
  return {
    fromDate: '',
    isPrimaryGroupingByAmount: false,
    chartSlabs: [defaultSlab(template)]
  };
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
  const periodOptions = toSelectOptions(template.chartTemplate?.periodTypes);

  function updateCharts(next: Chart[]) {
    onChange({ charts: next });
  }

  function updateChart(index: number, patch: Partial<Chart>) {
    updateCharts(charts.map((chart, i) => (i === index ? { ...chart, ...patch } : chart)));
  }

  function updateSlab(chartIndex: number, slabIndex: number, patch: Partial<Slab>) {
    const chart = charts[chartIndex];
    if (!chart) {
      return;
    }
    const nextSlabs = chart.chartSlabs.map((slab, i) =>
      i === slabIndex ? { ...slab, ...patch } : slab
    );
    updateChart(chartIndex, { chartSlabs: nextSlabs });
  }

  function addChart() {
    updateCharts([...charts, defaultChart(template)]);
  }

  function removeChart(index: number) {
    if (charts.length <= 1) {
      return;
    }
    updateCharts(charts.filter((_, i) => i !== index));
  }

  function addSlab(chartIndex: number) {
    const chart = charts[chartIndex];
    if (!chart) {
      return;
    }
    updateChart(chartIndex, {
      chartSlabs: [...chart.chartSlabs, defaultSlab(template)]
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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define interest rate charts with slabs for amount and period ranges.
      </p>

      {errors['interestRateChart.charts'] ? (
        <p className="text-sm text-destructive">{errors['interestRateChart.charts']}</p>
      ) : null}

      {charts.map((chart, chartIndex) => (
        <Card key={chartIndex}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Chart {chartIndex + 1}</CardTitle>
            {charts.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeChart(chartIndex)}>
                <Trash2 className="mr-1 size-4" />
                Remove chart
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`chart-${chartIndex}-name`}
                label="Name"
                optional
                value={chart.name ?? ''}
                onChange={(name) => updateChart(chartIndex, { name })}
              />
              <DateField
                id={`chart-${chartIndex}-fromDate`}
                label="From date"
                required
                allowFuture
                value={chart.fromDate || undefined}
                onChange={(fromDate) => updateChart(chartIndex, { fromDate: fromDate ?? '' })}
                error={errors[`interestRateChart.charts.${chartIndex}.fromDate`]}
              />
              <DateField
                id={`chart-${chartIndex}-endDate`}
                label="End date"
                optional
                allowFuture
                value={chart.endDate || undefined}
                onChange={(endDate) => updateChart(chartIndex, { endDate: endDate ?? '' })}
              />
              <SwitchField
                id={`chart-${chartIndex}-groupByAmount`}
                label="Primary grouping by amount"
                checked={chart.isPrimaryGroupingByAmount ?? false}
                onCheckedChange={(isPrimaryGroupingByAmount) =>
                  updateChart(chartIndex, { isPrimaryGroupingByAmount })
                }
              />
            </div>

            <DetailSection title="Chart slabs">
              {chart.chartSlabs.map((slab, slabIndex) => (
                <div
                  key={slabIndex}
                  className="mb-4 rounded-lg border border-border p-4 last:mb-0"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Slab {slabIndex + 1}</p>
                    {chart.chartSlabs.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlab(chartIndex, slabIndex)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      id={`slab-${chartIndex}-${slabIndex}-periodType`}
                      label="Period type"
                      required
                      value={
                        slab.periodType != null ? String(slab.periodType) : undefined
                      }
                      onValueChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          periodType: value ? Number(value) : undefined
                        })
                      }
                      options={periodOptions}
                      error={
                        errors[
                          `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.periodType`
                        ]
                      }
                    />
                    <NumericField
                      id={`slab-${chartIndex}-${slabIndex}-fromPeriod`}
                      label="Period from"
                      required
                      integer
                      value={slab.fromPeriod != null ? String(slab.fromPeriod) : ''}
                      onChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          fromPeriod: value === '' ? undefined : Number(value)
                        })
                      }
                      error={
                        errors[
                          `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.fromPeriod`
                        ]
                      }
                    />
                    <NumericField
                      id={`slab-${chartIndex}-${slabIndex}-toPeriod`}
                      label="Period to"
                      optional
                      integer
                      value={slab.toPeriod != null ? String(slab.toPeriod) : ''}
                      onChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          toPeriod: value === '' ? undefined : Number(value)
                        })
                      }
                    />
                    <NumericField
                      id={`slab-${chartIndex}-${slabIndex}-amountFrom`}
                      label="Amount from"
                      optional
                      value={slab.amountRangeFrom != null ? String(slab.amountRangeFrom) : ''}
                      onChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          amountRangeFrom: value === '' ? undefined : Number(value)
                        })
                      }
                    />
                    <NumericField
                      id={`slab-${chartIndex}-${slabIndex}-amountTo`}
                      label="Amount to"
                      optional
                      value={slab.amountRangeTo != null ? String(slab.amountRangeTo) : ''}
                      onChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          amountRangeTo: value === '' ? undefined : Number(value)
                        })
                      }
                    />
                    <NumericField
                      id={`slab-${chartIndex}-${slabIndex}-rate`}
                      label="Annual interest rate"
                      required
                      value={
                        slab.annualInterestRate != null ? String(slab.annualInterestRate) : ''
                      }
                      onChange={(value) =>
                        updateSlab(chartIndex, slabIndex, {
                          annualInterestRate: value === '' ? undefined : Number(value)
                        })
                      }
                      error={
                        errors[
                          `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.annualInterestRate`
                        ]
                      }
                    />
                    <TextField
                      id={`slab-${chartIndex}-${slabIndex}-description`}
                      label="Description"
                      required
                      value={slab.description}
                      onChange={(description) => updateSlab(chartIndex, slabIndex, { description })}
                      error={
                        errors[
                          `interestRateChart.charts.${chartIndex}.chartSlabs.${slabIndex}.description`
                        ]
                      }
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addSlab(chartIndex)}>
                <Plus className="mr-1 size-4" />
                Add slab
              </Button>
            </DetailSection>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addChart}>
        <Plus className="mr-1 size-4" />
        Add chart
      </Button>
    </div>
  );
}

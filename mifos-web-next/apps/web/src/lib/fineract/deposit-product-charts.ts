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
  DepositProductInterestChartIncentive,
  DepositProductInterestChartSlab
} from '@mifos/api-client';
import { asEnumOption, asProductDateString } from '@/lib/fineract/product-normalize';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeIncentive(raw: unknown): DepositProductInterestChartIncentive | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    entityType: asEnumOption(row.entityType),
    attributeName: asEnumOption(row.attributeName),
    conditionType: asEnumOption(row.conditionType),
    attributeValue:
      typeof row.attributeValue === 'string'
        ? row.attributeValue
        : row.attributeValue != null
          ? String(row.attributeValue)
          : undefined,
    incentiveType: asEnumOption(row.incentiveType),
    amount: toNumber(row.amount)
  };
}

function normalizeSlab(raw: unknown): DepositProductInterestChartSlab | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const incentivesRaw = row.incentives;
  const incentives = Array.isArray(incentivesRaw)
    ? incentivesRaw
        .map((item) => normalizeIncentive(item))
        .filter((item): item is DepositProductInterestChartIncentive => item !== null)
    : undefined;

  return {
    id: toNumber(row.id),
    periodType: asEnumOption(row.periodType),
    fromPeriod: toNumber(row.fromPeriod),
    toPeriod: toNumber(row.toPeriod),
    amountRangeFrom: toNumber(row.amountRangeFrom),
    amountRangeTo: toNumber(row.amountRangeTo),
    annualInterestRate: toNumber(row.annualInterestRate),
    description: typeof row.description === 'string' ? row.description : undefined,
    incentives
  };
}

function normalizeChart(raw: unknown): DepositProductInterestChart | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const slabsRaw = row.chartSlabs;
  const slabsSource = Array.isArray(slabsRaw) ? slabsRaw : slabsRaw ? [slabsRaw] : [];
  const chartSlabs = slabsSource
    .map((item) => normalizeSlab(item))
    .filter((item): item is DepositProductInterestChartSlab => item !== null);

  return {
    id: toNumber(row.id),
    name: typeof row.name === 'string' ? row.name : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    fromDate: asProductDateString(row.fromDate),
    endDate: asProductDateString(row.endDate),
    isPrimaryGroupingByAmount:
      typeof row.isPrimaryGroupingByAmount === 'boolean'
        ? row.isPrimaryGroupingByAmount
        : undefined,
    chartSlabs
  };
}

/** Normalize one or many chart payloads from Fineract GET responses. */
export function normalizeDepositProductCharts(raw: unknown): DepositProductInterestChart[] {
  if (!raw) {
    return [];
  }
  const items = Array.isArray(raw) ? raw : [raw];
  return items
    .map((item) => normalizeChart(item))
    .filter((item): item is DepositProductInterestChart => item !== null);
}

/** Charts to display on product detail — all charts when present, else active chart. */
export function depositProductCharts(product: DepositProductDetail): DepositProductInterestChart[] {
  if (product.interestRateCharts?.length) {
    return product.interestRateCharts;
  }
  return normalizeDepositProductCharts(product.activeChart);
}

export function formatChartSlabPeriod(slab: DepositProductInterestChartSlab): string {
  if (slab.fromPeriod == null && slab.toPeriod == null) {
    return '—';
  }
  const periodLabel = enumOptionLabel(slab.periodType);
  const range =
    slab.toPeriod != null ? `${slab.fromPeriod ?? '—'} – ${slab.toPeriod}` : String(slab.fromPeriod);
  return periodLabel ? `${range} ${periodLabel}` : range;
}

export function formatChartSlabAmountRange(slab: DepositProductInterestChartSlab): string {
  if (slab.amountRangeFrom == null && slab.amountRangeTo == null) {
    return '—';
  }
  if (slab.amountRangeTo == null) {
    return String(slab.amountRangeFrom);
  }
  return `${slab.amountRangeFrom ?? '—'} – ${slab.amountRangeTo}`;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunResult } from '@mifos/api-client';
import { sanitizeReportRunRows } from '@/lib/fineract/report-run-display';
import type {
  DashboardAmountBreakdown,
  DashboardAnalytics,
  DashboardTimescale,
  DashboardTrendPoint
} from '@/lib/dashboard/analytics-types';

export function normalizeDashboardReportRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  }
  if (raw && typeof raw === 'object') {
    return sanitizeReportRunRows(raw as FineractReportRunResult);
  }
  return [];
}

export function extractAmountPair(
  rows: Record<string, unknown>[],
  reportName: string
): DashboardAmountBreakdown {
  const firstRow = rows[0] ?? {};
  const numericEntries = Object.entries(firstRow)
    .map(([key, value]) => ({
      key: key.toLowerCase(),
      value: Number(value)
    }))
    .filter((entry) => !Number.isNaN(entry.value));

  const pendingValue = findValueByKeys(numericEntries, ['pending', 'awaiting', 'demand']);
  const completeValue = findValueByKeys(
    numericEntries,
    reportName === 'Demand Vs Collection'
      ? ['collection', 'collected']
      : ['disburs', 'disbursement', 'disbursal']
  );

  if (pendingValue !== undefined && completeValue !== undefined) {
    return {
      pending: Math.max(0, pendingValue),
      complete: Math.max(0, completeValue)
    };
  }

  const values = numericEntries.map((entry) => entry.value).slice(0, 2);
  return {
    pending: Math.max(0, values[0] ?? 0),
    complete: Math.max(0, values[1] ?? 0)
  };
}

function findValueByKeys(
  entries: { key: string; value: number }[],
  keys: string[]
): number | undefined {
  return entries.find((entry) => keys.some((key) => entry.key.includes(key)))?.value;
}

export function getTrendReportName(timescale: DashboardTimescale, type: 'client' | 'loan'): string {
  const base = type === 'client' ? 'ClientTrendsBy' : 'LoanTrendsBy';
  return `${base}${timescale}`;
}

export function buildTrendSeries(
  timescale: DashboardTimescale,
  clientRows: Record<string, unknown>[],
  loanRows: Record<string, unknown>[]
): DashboardTrendPoint[] {
  const labels = getTimescaleLabels(timescale);
  return labels.map((label) => ({
    label,
    clients: readTrendValue(clientRows, timescale, label, 'count'),
    loans: readTrendValue(loanRows, timescale, label, 'lcount')
  }));
}

function readTrendValue(
  rows: Record<string, unknown>[],
  timescale: DashboardTimescale,
  label: string,
  valueField: string
): number {
  const entry = rows.find((row) => resolveTrendLabel(row, timescale) === label);
  if (!entry) {
    return 0;
  }
  const direct = Number(entry[valueField]);
  if (Number.isFinite(direct)) {
    return direct;
  }
  const match = Object.entries(entry).find(([key]) => key.toLowerCase() === valueField.toLowerCase());
  const fallback = Number(match?.[1]);
  return Number.isFinite(fallback) ? fallback : 0;
}

function resolveTrendLabel(entry: Record<string, unknown>, timescale: DashboardTimescale): string {
  switch (timescale) {
    case 'Day':
      return formatDayLabel(entry.days ?? entry.Days);
    case 'Week':
      return `${entry.Weeks ?? entry.weeks ?? ''}`;
    case 'Month':
      return `${entry.Months ?? entry.months ?? ''}`;
    default:
      return '';
  }
}

export function getTimescaleLabels(timescale: DashboardTimescale): string[] {
  const labels: string[] = [];
  const cursor = new Date();

  switch (timescale) {
    case 'Day':
      while (labels.length < 12) {
        cursor.setDate(cursor.getDate() - 1);
        labels.push(formatDayLabel(cursor));
      }
      break;
    case 'Week':
      while (labels.length < 12) {
        cursor.setDate(cursor.getDate() - 7);
        labels.push(`${getWeekNumber(cursor)}`);
      }
      break;
    case 'Month':
      while (labels.length < 12) {
        labels.push(cursor.toLocaleString(undefined, { month: 'long' }));
        cursor.setMonth(cursor.getMonth() - 1);
      }
      break;
  }

  return labels.reverse();
}

function formatDayLabel(value: unknown): string {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function getWeekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - firstDay.getTime()) / 86400000 + firstDay.getDay() + 1) / 7);
}

export function isAnalyticsEmpty(analytics: DashboardAnalytics): boolean {
  const collection = analytics.collectionBreakdown;
  const disbursement = analytics.disbursementBreakdown;
  const trends = analytics.trends ?? [];

  const amountsEmpty =
    (collection?.pending ?? 0) === 0 &&
    (collection?.complete ?? 0) === 0 &&
    (disbursement?.pending ?? 0) === 0 &&
    (disbursement?.complete ?? 0) === 0;
  const trendsEmpty = trends.every((point) => point.clients === 0 && point.loans === 0);

  return amountsEmpty && trendsEmpty;
}
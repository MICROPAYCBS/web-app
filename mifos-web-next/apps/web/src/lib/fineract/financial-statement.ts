/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportRunColumnHeader,
  FineractReportRunParameter,
  FineractReportRunResult
} from '@mifos/api-client';
import { isReportParameterDate, toDecimal } from '@mifos/domain';
import Decimal from 'decimal.js';
import {
  FINANCIAL_REPORTS,
  type FinancialReportSlug
} from '@/lib/fineract/financial-reports';
import { DEFAULT_REPORT_ORG_NAME } from '@/lib/fineract/report-branding';
import {
  isReportColumnNumeric,
  sanitizeReportRunRows
} from '@/lib/fineract/report-run-display';

export type FinancialStatementLineKind = 'section' | 'line' | 'total' | 'surplus';

export type FinancialStatementLine = {
  id: string;
  kind: FinancialStatementLineKind;
  group: string;
  label: string;
  amountLabel?: string;
  debitLabel?: string;
  creditLabel?: string;
};

export type FinancialStatement = {
  slug: FinancialReportSlug;
  title: string;
  organisationName: string;
  periodLabel?: string;
  officeLabel?: string;
  currencyCode?: string;
  layout: 'amount' | 'debit-credit';
  lines: FinancialStatementLine[];
  imbalanceNote?: string;
};

export type FinancialStatementBuildResult =
  | { ok: true; statement: FinancialStatement }
  | { ok: false };

export type BuildFinancialStatementInput = {
  slug: FinancialReportSlug;
  result: FineractReportRunResult;
  organisationName?: string;
  parameters?: FineractReportRunParameter[];
  values?: Record<string, string>;
  /** Select option labels keyed by the same field name as `values`. */
  displayValues?: Record<string, string>;
};

const PREFERRED_GROUPS: Record<'balance-sheet' | 'income-statement', string[]> = {
  'balance-sheet': ['Assets', 'Liability', 'Equity'],
  'income-statement': ['Income', 'Expense']
};

const SURPLUS_LABEL = 'Net surplus / (deficit)';

function normalizeHeader(name: string): string {
  return name.toLowerCase().replace(/[\s_]/g, '');
}

function parameterFieldName(parameter: FineractReportRunParameter): string {
  return parameter.parameterVariable || parameter.parameterName;
}

function parameterCompactName(parameter: FineractReportRunParameter): string {
  return `${parameter.parameterName ?? ''} ${parameter.parameterVariable ?? ''} ${parameter.parameterLabel ?? ''}`
    .toLowerCase()
    .replace(/[\s_]/g, '');
}

function findHeader(
  headers: FineractReportRunColumnHeader[],
  test: (normalized: string) => boolean
): string | null {
  return headers.find((column) => test(normalizeHeader(column.columnName)))?.columnName ?? null;
}

function pickSideColumn(
  headers: FineractReportRunColumnHeader[],
  side: 'debit' | 'credit'
): string | null {
  const other = side === 'debit' ? 'credit' : 'debit';
  const candidates = headers.filter((column) => {
    const name = normalizeHeader(column.columnName);
    return name.includes(side) && !name.includes(other);
  });
  if (!candidates.length) {
    return null;
  }
  const closing = candidates.find((column) => normalizeHeader(column.columnName).includes('closing'));
  if (closing) {
    return closing.columnName;
  }
  const exact = candidates.find((column) => {
    const name = normalizeHeader(column.columnName);
    return name === side || name === `${side}amount`;
  });
  return (exact ?? candidates[candidates.length - 1]).columnName;
}

function findBalanceColumn(
  headers: FineractReportRunColumnHeader[],
  excluded: Set<string>
): string | null {
  const exact = findHeader(headers, (name) => name === 'balance' || name === 'amount' || name === 'total');
  if (exact) {
    return exact;
  }
  const numeric = [...headers].reverse().find((column) => {
    if (excluded.has(column.columnName)) {
      return false;
    }
    const name = normalizeHeader(column.columnName);
    if (name.includes('debit') || name.includes('credit') || name.includes('currency')) {
      return false;
    }
    return isReportColumnNumeric(column.columnType);
  });
  return numeric?.columnName ?? null;
}

type StatementColumns = {
  code: string | null;
  name: string | null;
  category: string | null;
  balance: string | null;
  debit: string | null;
  credit: string | null;
  currency: string | null;
};

function detectColumns(headers: FineractReportRunColumnHeader[]): StatementColumns {
  const debit = pickSideColumn(headers, 'debit');
  const credit = pickSideColumn(headers, 'credit');
  const excluded = new Set([debit, credit].filter((name): name is string => Boolean(name)));
  return {
    code: findHeader(
      headers,
      (name) =>
        name === 'glcode' ||
        name === 'code' ||
        name === 'accountno' ||
        name === 'accountnumber' ||
        (name.endsWith('code') && !name.includes('currency'))
    ),
    name: findHeader(
      headers,
      (name) =>
        name === 'name' ||
        name === 'account' ||
        name === 'accountname' ||
        name.endsWith('accountname') ||
        name.includes('description')
    ),
    category: findHeader(
      headers,
      (name) =>
        name === 'incomeorexpense' ||
        name === 'balancetype' ||
        name === 'type' ||
        name === 'category' ||
        name === 'classification' ||
        name === 'accounttype' ||
        name === 'gltype'
    ),
    balance: findBalanceColumn(headers, excluded),
    debit,
    credit,
    currency: findHeader(
      headers,
      (name) => name === 'currency' || name === 'currencycode' || name === 'isocode'
    )
  };
}

function cellText(row: Record<string, unknown>, columnName: string | null): string {
  if (!columnName) {
    return '';
  }
  const value = row[columnName];
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

export function parseStatementAmount(value: unknown): Decimal {
  if (value == null || value === '') {
    return new Decimal(0);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Decimal(value) : new Decimal(0);
  }
  if (typeof value === 'bigint') {
    return new Decimal(value.toString());
  }

  let text = String(value).trim();
  if (!text || text === '—' || text === '-') {
    return new Decimal(0);
  }
  const parenNegative = text.startsWith('(') && text.endsWith(')');
  text = text.replace(/[()]/g, '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (!text || text === '-' || text === '.') {
    return new Decimal(0);
  }
  const decimal = toDecimal(text);
  if (!decimal) {
    return new Decimal(0);
  }
  if (parenNegative && decimal.greaterThan(0)) {
    return decimal.negated();
  }
  return decimal;
}

function formatStatementAmount(amount: Decimal, currencyCode?: string): string {
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber());
  const code = currencyCode?.trim().toUpperCase();
  return code ? `${code} ${formatted}` : formatted;
}

function accountLabel(code: string, name: string): string {
  if (code && name && code !== name) {
    return `${code} — ${name}`;
  }
  return name || code;
}

function normalizeGroup(raw: string, slug: 'balance-sheet' | 'income-statement'): string {
  const value = raw.trim() || 'Uncategorized';
  const lower = value.toLowerCase();
  if (slug === 'income-statement') {
    if (lower.startsWith('income') || lower === 'revenue') {
      return 'Income';
    }
    if (lower.startsWith('expense')) {
      return 'Expense';
    }
    return value;
  }
  if (lower.startsWith('asset')) {
    return 'Assets';
  }
  if (lower.startsWith('liab')) {
    return 'Liability';
  }
  if (lower.startsWith('equity') || lower.includes('capital')) {
    return 'Equity';
  }
  return value;
}

function formatPeriodDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function isStartDateParameter(parameter: FineractReportRunParameter): boolean {
  const compact = parameterCompactName(parameter);
  return compact.includes('start') || compact.includes('from');
}

function isEndDateParameter(parameter: FineractReportRunParameter): boolean {
  const compact = parameterCompactName(parameter);
  return (
    compact.includes('end') ||
    compact.includes('ason') ||
    compact.includes('asof') ||
    compact.includes('todate')
  );
}

function isOfficeParameter(parameter: FineractReportRunParameter): boolean {
  const compact = parameterCompactName(parameter);
  return compact.includes('office') || compact.includes('branch');
}

export function financialStatementPeriodLabel(
  parameters: FineractReportRunParameter[],
  values: Record<string, string>
): string | undefined {
  const dates = parameters.flatMap((parameter) => {
    if (!isReportParameterDate(parameter)) {
      return [];
    }
    const value = values[parameterFieldName(parameter)]?.trim();
    if (!value) {
      return [];
    }
    return [{ parameter, value }];
  });

  if (!dates.length) {
    return undefined;
  }
  if (dates.length === 1) {
    return `As of ${formatPeriodDate(dates[0].value)}`;
  }

  const start = dates.find((entry) => isStartDateParameter(entry.parameter));
  const end = dates.find((entry) => isEndDateParameter(entry.parameter));
  if (start && end && start !== end) {
    return `${formatPeriodDate(start.value)} – ${formatPeriodDate(end.value)}`;
  }

  return `${formatPeriodDate(dates[0].value)} – ${formatPeriodDate(dates[dates.length - 1].value)}`;
}

export function financialStatementOfficeLabel(
  parameters: FineractReportRunParameter[],
  values: Record<string, string>,
  displayValues: Record<string, string>
): string | undefined {
  const office = parameters.find((parameter) => isOfficeParameter(parameter));
  if (!office) {
    return undefined;
  }
  const fieldName = parameterFieldName(office);
  const rawValue = values[fieldName]?.trim();
  if (!rawValue || rawValue === '-1') {
    return undefined;
  }
  const label = displayValues[fieldName]?.trim();
  if (!label || label.toLowerCase() === 'all' || label === '-1') {
    return undefined;
  }
  return label;
}

function currencyCodeFromRows(
  rows: Record<string, unknown>[],
  columnName: string | null
): string | undefined {
  if (!columnName) {
    return undefined;
  }
  for (const row of rows) {
    const value = cellText(row, columnName).toUpperCase();
    if (/^[A-Z]{3}$/.test(value)) {
      return value;
    }
  }
  return undefined;
}

type AccountEntry = {
  group: string;
  code: string;
  name: string;
  amount: Decimal;
  debit: Decimal;
  credit: Decimal;
};

function readEntries(
  rows: Record<string, unknown>[],
  columns: StatementColumns,
  slug: FinancialReportSlug
): AccountEntry[] {
  const entries: AccountEntry[] = [];
  for (const row of rows) {
    const code = cellText(row, columns.code);
    const name = cellText(row, columns.name);
    const amount = columns.balance ? parseStatementAmount(row[columns.balance]) : new Decimal(0);
    const debit = columns.debit ? parseStatementAmount(row[columns.debit]) : new Decimal(0);
    const credit = columns.credit ? parseStatementAmount(row[columns.credit]) : new Decimal(0);
    if (!code && !name && amount.isZero() && debit.isZero() && credit.isZero()) {
      continue;
    }
    const group =
      slug === 'trial-balance'
        ? ''
        : normalizeGroup(cellText(row, columns.category), slug);
    entries.push({ group, code, name, amount, debit, credit });
  }
  return entries;
}

function groupOrder(slug: 'balance-sheet' | 'income-statement', entries: AccountEntry[]): string[] {
  const seen: string[] = [];
  for (const entry of entries) {
    if (!seen.includes(entry.group)) {
      seen.push(entry.group);
    }
  }
  const preferred = PREFERRED_GROUPS[slug];
  return [
    ...preferred.filter((group) => seen.includes(group)),
    ...seen.filter((group) => !preferred.includes(group))
  ];
}

function buildGroupedLines(
  slug: 'balance-sheet' | 'income-statement',
  entries: AccountEntry[],
  currencyCode?: string
): FinancialStatementLine[] {
  const lines: FinancialStatementLine[] = [];
  const totals = new Map<string, Decimal>();

  for (const group of groupOrder(slug, entries)) {
    const groupEntries = entries
      .filter((entry) => entry.group === group)
      .sort((left, right) => {
        const byCode = left.code.localeCompare(right.code, undefined, { numeric: true });
        if (byCode !== 0) {
          return byCode;
        }
        return left.name.localeCompare(right.name);
      });

    lines.push({
      id: `section-${group}`,
      kind: 'section',
      group,
      label: group
    });

    let total = new Decimal(0);
    groupEntries.forEach((entry, index) => {
      total = total.plus(entry.amount);
      lines.push({
        id: `line-${group}-${index}-${entry.code || entry.name}`,
        kind: 'line',
        group,
        label: accountLabel(entry.code, entry.name),
        amountLabel: formatStatementAmount(entry.amount, currencyCode)
      });
    });
    totals.set(group, total);
    lines.push({
      id: `total-${group}`,
      kind: 'total',
      group,
      label: `Total ${group}`,
      amountLabel: formatStatementAmount(total, currencyCode)
    });
  }

  if (slug === 'income-statement' && (totals.has('Income') || totals.has('Expense'))) {
    const income = totals.get('Income') ?? new Decimal(0);
    const expense = totals.get('Expense') ?? new Decimal(0);
    lines.push({
      id: 'surplus',
      kind: 'surplus',
      group: '',
      label: SURPLUS_LABEL,
      amountLabel: formatStatementAmount(income.minus(expense), currencyCode)
    });
  }

  return lines;
}

function buildTrialBalanceLines(
  entries: AccountEntry[],
  currencyCode?: string
): { lines: FinancialStatementLine[]; imbalanceNote?: string } {
  const sorted = [...entries].sort((left, right) => {
    const byCode = left.code.localeCompare(right.code, undefined, { numeric: true });
    if (byCode !== 0) {
      return byCode;
    }
    return left.name.localeCompare(right.name);
  });

  let debitTotal = new Decimal(0);
  let creditTotal = new Decimal(0);
  const lines: FinancialStatementLine[] = sorted.map((entry, index) => {
    debitTotal = debitTotal.plus(entry.debit);
    creditTotal = creditTotal.plus(entry.credit);
    return {
      id: `line-${index}-${entry.code || entry.name}`,
      kind: 'line' as const,
      group: '',
      label: accountLabel(entry.code, entry.name),
      debitLabel: formatStatementAmount(entry.debit, currencyCode),
      creditLabel: formatStatementAmount(entry.credit, currencyCode)
    };
  });

  lines.push({
    id: 'total',
    kind: 'total',
    group: '',
    label: 'Total',
    debitLabel: formatStatementAmount(debitTotal, currencyCode),
    creditLabel: formatStatementAmount(creditTotal, currencyCode)
  });

  const roundedDebit = debitTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const roundedCredit = creditTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (roundedDebit.equals(roundedCredit)) {
    return { lines };
  }

  const difference = roundedDebit.minus(roundedCredit).abs();
  return {
    lines,
    imbalanceNote: `Debits and credits differ by ${formatStatementAmount(difference, currencyCode)}.`
  };
}

export function buildFinancialStatement(
  input: BuildFinancialStatementInput
): FinancialStatementBuildResult {
  const headers = input.result.columnHeaders ?? [];
  if (!headers.length) {
    return { ok: false };
  }

  const columns = detectColumns(headers);
  if (!columns.code && !columns.name) {
    return { ok: false };
  }
  if (input.slug === 'trial-balance') {
    if (!columns.debit || !columns.credit) {
      return { ok: false };
    }
  } else if (!columns.category || !columns.balance) {
    return { ok: false };
  }

  const rows = sanitizeReportRunRows(input.result);
  const currencyCode = currencyCodeFromRows(rows, columns.currency);
  const entries = readEntries(rows, columns, input.slug);
  const parameters = input.parameters ?? [];
  const values = input.values ?? {};
  const displayValues = input.displayValues ?? {};
  const definition = FINANCIAL_REPORTS[input.slug];
  let lines: FinancialStatementLine[];
  let imbalanceNote: string | undefined;
  if (input.slug === 'trial-balance') {
    const trial = buildTrialBalanceLines(entries, currencyCode);
    lines = trial.lines;
    imbalanceNote = trial.imbalanceNote;
  } else {
    lines = buildGroupedLines(input.slug, entries, currencyCode);
  }

  return {
    ok: true,
    statement: {
      slug: input.slug,
      title: definition.label,
      organisationName: input.organisationName?.trim() || DEFAULT_REPORT_ORG_NAME,
      periodLabel: financialStatementPeriodLabel(parameters, values),
      officeLabel: financialStatementOfficeLabel(parameters, values, displayValues),
      currencyCode,
      layout: input.slug === 'trial-balance' ? 'debit-credit' : 'amount',
      lines,
      imbalanceNote
    }
  };
}

function csvCell(value: string): string {
  let text = value;
  if (/^[=+\-@]/.test(text.trim())) {
    text = `'${text}`;
  }
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function financialStatementToCsv(statement: FinancialStatement): string {
  const header =
    statement.layout === 'debit-credit'
      ? ['Account', 'Debit', 'Credit']
      : ['Section', 'Account', 'Amount'];
  const body = statement.lines.map((line) => {
    if (statement.layout === 'debit-credit') {
      return [line.label, line.debitLabel ?? '', line.creditLabel ?? ''];
    }
    if (line.kind === 'section') {
      return [line.label, '', ''];
    }
    return [line.group, line.label, line.amountLabel ?? ''];
  });
  const lines = [header, ...body].map((row) => row.map(csvCell).join(','));
  return `\uFEFF${lines.join('\n')}`;
}

export function financialStatementFileName(
  slug: FinancialReportSlug,
  extension: 'csv' | 'pdf',
  on = new Date()
): string {
  const year = on.getFullYear();
  const month = String(on.getMonth() + 1).padStart(2, '0');
  const day = String(on.getDate()).padStart(2, '0');
  return `${slug}-${year}-${month}-${day}.${extension}`;
}

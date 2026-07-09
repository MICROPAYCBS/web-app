/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Fineract `stretchy_parameter.parameter_name` → `parameter_variable`.
 * Sourced from standard Fineract seed data; used when the reports template API
 * omits `parameter_variable`.
 */
export const STRETCHY_PARAMETER_VARIABLES = {
  startDateSelect: 'startDate',
  endDateSelect: 'endDate',
  obligDateTypeSelect: 'obligDateType',
  OfficeIdSelectOne: 'officeId',
  loanOfficerIdSelectAll: 'loanOfficerId',
  currencyIdSelectAll: 'currencyId',
  departmentIdSelectAll: 'departmentId',
  fundIdSelectAll: 'fundId',
  loanProductIdSelectAll: 'loanProductId',
  loanPurposeIdSelectAll: 'loanPurposeId',
  parTypeSelect: 'parType',
  selectAccount: 'accountNo',
  savingsProductIdSelectAll: 'savingsProductId',
  transactionId: 'transactionId',
  selectCenterId: 'centerId',
  SelectGLAccountNO: 'GLAccountNO',
  asOnDate: 'asOn',
  SavingsAccountSubStatus: 'subStatus',
  cycleXSelect: 'cycleX',
  cycleYSelect: 'cycleY',
  fromXSelect: 'fromX',
  toYSelect: 'toY',
  overdueXSelect: 'overdueX',
  overdueYSelect: 'overdueY',
  DefaultLoan: 'loanId',
  DefaultClient: 'clientId',
  DefaultGroup: 'groupId',
  SelectLoanType: 'loanType',
  DefaultSavings: 'savingsId',
  DefaultSavingsTransactionId: 'savingsTransactionId'
} as const satisfies Record<string, string>;

export type StretchyParameterName = keyof typeof STRETCHY_PARAMETER_VARIABLES;

/** User-facing labels for standard Fineract stretchy parameters (Micropay uses Branch, not Office). */
export const REPORT_PARAMETER_DISPLAY_LABELS: Record<string, string> = {
  startDateSelect: 'Start Date',
  endDateSelect: 'End Date',
  obligDateTypeSelect: 'Obligation Date Type',
  OfficeIdSelectOne: 'Branch',
  loanOfficerIdSelectAll: 'Loan Officer',
  currencyIdSelectAll: 'Currency',
  departmentIdSelectAll: 'Department',
  fundIdSelectAll: 'Fund',
  loanProductIdSelectAll: 'Product',
  loanPurposeIdSelectAll: 'Loan Purpose',
  parTypeSelect: 'PAR Type',
  selectAccount: 'Account Number',
  savingsProductIdSelectAll: 'Savings Product',
  transactionId: 'Transaction ID',
  selectCenterId: 'Center',
  SelectGLAccountNO: 'GL Account Number',
  asOnDate: 'As On Date',
  SavingsAccountSubStatus: 'Savings Account Status',
  cycleXSelect: 'Cycle X Number',
  cycleYSelect: 'Cycle Y Number',
  fromXSelect: 'From X Number',
  toYSelect: 'To Y Number',
  overdueXSelect: 'Overdue X Number',
  overdueYSelect: 'Overdue Y Number',
  DefaultLoan: 'Loan',
  DefaultClient: 'Client',
  DefaultGroup: 'Group',
  SelectLoanType: 'Loan Type',
  DefaultSavings: 'Savings',
  DefaultSavingsTransactionId: 'Savings Transaction'
};

export type ReportParameterLabelInput = {
  parameterName?: string;
  parameterLabel?: string;
  displayLabel?: string;
  reportParameterName?: string;
};

export function catalogReportParameterVariable(parameterName: string): string | undefined {
  const trimmed = parameterName.trim();
  const direct = STRETCHY_PARAMETER_VARIABLES[trimmed as StretchyParameterName];
  if (direct) {
    return direct;
  }
  const match = Object.entries(STRETCHY_PARAMETER_VARIABLES).find(
    ([name]) => name.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.[1];
}

function looksLikeInternalLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed in REPORT_PARAMETER_DISPLAY_LABELS) {
    return true;
  }
  if (/select(one|all)$/i.test(trimmed)) {
    return true;
  }
  // Report SQL binding names (branch, date, currencyId) and stretchy catalog names.
  if (/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) {
    return true;
  }
  return false;
}

function formatReportParameterName(parameterName: string): string {
  const normalized = parameterName
    .replace(/Select(One|All)$/i, '')
    .replace(/Id$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

  if (!normalized) {
    return parameterName;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function knownDisplayLabel(parameterName: string): string | undefined {
  const trimmed = parameterName.trim();
  const direct = REPORT_PARAMETER_DISPLAY_LABELS[trimmed];
  if (direct) {
    return direct;
  }
  const match = Object.entries(REPORT_PARAMETER_DISPLAY_LABELS).find(
    ([name]) => name.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.[1];
}

/** Resolves the label shown in report parameter forms and audit-friendly UIs. */
export function resolveReportParameterDisplayLabel(parameter: ReportParameterLabelInput): string {
  const rawDisplayLabel = parameter.displayLabel?.trim();
  if (rawDisplayLabel && rawDisplayLabel.toLowerCase() !== 'n/a' && !looksLikeInternalLabel(rawDisplayLabel)) {
    return rawDisplayLabel;
  }

  const rawLabel = parameter.parameterLabel?.trim();
  if (rawLabel && rawLabel.toLowerCase() !== 'n/a' && !looksLikeInternalLabel(rawLabel)) {
    if (
      rawLabel.toLowerCase() === 'office' &&
      catalogReportParameterVariable(parameter.parameterName ?? '') === 'officeId'
    ) {
      return 'Branch';
    }
    return rawLabel;
  }

  if (parameter.parameterName) {
    return knownDisplayLabel(parameter.parameterName) ?? formatReportParameterName(parameter.parameterName);
  }

  return '';
}

export type ReportParameterPresentationHints = {
  parameterDisplayType?: string;
  selectOne?: boolean;
  selectAll?: boolean;
};

/** Infer UI control hints from Fineract stretchy parameter naming when metadata flags are missing. */
export function inferReportParameterPresentation(
  parameterName: string,
  hints: ReportParameterPresentationHints = {}
): ReportParameterPresentationHints {
  const name = parameterName.trim();
  const lowerName = name.toLowerCase();
  const displayType = hints.parameterDisplayType?.trim().toLowerCase();

  const isDateParam =
    displayType === 'date' || lowerName.endsWith('dateselect') || lowerName === 'asondate';

  if (isDateParam) {
    return {
      parameterDisplayType: hints.parameterDisplayType || 'date',
      selectOne: false,
      selectAll: false
    };
  }

  let selectOne = hints.selectOne === true;
  let selectAll = hints.selectAll === true;

  if (!selectOne && !selectAll) {
    if (/selectall$/i.test(name)) {
      selectAll = true;
    } else if (/selectone$/i.test(name)) {
      selectOne = true;
    } else if (/select$/i.test(name)) {
      selectOne = true;
    } else if (/^Select[A-Z]/.test(name)) {
      // Legacy Fineract catalog names (SelectGLAccountNO, SelectLoanType) — select without SelectOne suffix.
      selectOne = true;
    } else if (displayType === 'select') {
      selectOne = true;
    }
  }

  const result: ReportParameterPresentationHints = {};
  if (hints.parameterDisplayType) {
    result.parameterDisplayType = hints.parameterDisplayType;
  }
  if (selectOne) {
    result.selectOne = true;
  }
  if (selectAll) {
    result.selectAll = true;
  }
  return result;
}

export function isReportParameterSelect(parameter: ReportParameterPresentationHints): boolean {
  return (
    parameter.selectOne === true ||
    parameter.selectAll === true ||
    parameter.parameterDisplayType?.trim().toLowerCase() === 'select'
  );
}

/** Value Fineract stretchy SQL treats as “all rows” for SelectAll parameters. */
export const REPORT_PARAMETER_SELECT_ALL_VALUE = '-1';

export const REPORT_PARAMETER_SELECT_ALL_LABEL = 'All';

function isReportParameterSelectAllOptionId(id: string | number | null | undefined): boolean {
  return String(id ?? '').trim() === REPORT_PARAMETER_SELECT_ALL_VALUE;
}

/**
 * Appends the synthetic `{ id: '-1', name: 'All' }` option for SelectAll parameters.
 * No-op for plain SelectOne parameters or when `-1` is already present.
 */
export function withReportParameterSelectAllOption<T extends { id: string | number; name: string }>(
  options: T[],
  selectAll: boolean
): T[] {
  if (!selectAll) {
    return options;
  }
  if (options.some((option) => isReportParameterSelectAllOptionId(option.id))) {
    return options;
  }
  return [
    ...options,
    {
      id: REPORT_PARAMETER_SELECT_ALL_VALUE,
      name: REPORT_PARAMETER_SELECT_ALL_LABEL
    } as T
  ];
}

function reportParameterFormatType(parameter: {
  parameterFormatType?: string;
  parameterType?: string;
}): string {
  return (
    parameter.parameterFormatType?.trim().toLowerCase() ||
    parameter.parameterType?.trim().toLowerCase() ||
    ''
  );
}

export function isReportParameterDate(parameter: {
  parameterDisplayType?: string;
  parameterFormatType?: string;
  parameterType?: string;
  parameterName?: string;
}): boolean {
  const displayType = parameter.parameterDisplayType?.trim().toLowerCase();
  const formatType = reportParameterFormatType(parameter);
  if (displayType === 'date' || formatType === 'date') {
    return true;
  }
  const name = parameter.parameterName?.trim().toLowerCase();
  return Boolean(name && (name.endsWith('dateselect') || name === 'asondate'));
}

/** Stretchy parameters declared with `parameter_FormatType = number` (office id, funds, etc.). */
export function isReportParameterNumeric(parameter: {
  parameterDisplayType?: string;
  parameterFormatType?: string;
  parameterType?: string;
  parameterName?: string;
}): boolean {
  if (isReportParameterDate(parameter)) {
    return false;
  }
  const formatType = reportParameterFormatType(parameter);
  if (formatType === 'number') {
    return true;
  }
  const displayType = parameter.parameterDisplayType?.trim().toLowerCase();
  return displayType === 'number';
}

export function isReportCurrencyCodeParameter(
  parameterName?: string,
  parameterVariable?: string
): boolean {
  if (parameterVariable?.trim().toLowerCase() === 'currencyid') {
    return true;
  }
  const name = parameterName?.trim().toLowerCase();
  return name === 'currencyidselectall';
}

/** SQL placeholder name configured on a report definition (Pentaho/BIRT and query editor). */
export function reportEngineParameterName(
  parameterName: string,
  reportParameterName?: string
): string | undefined {
  const override = reportParameterName?.trim();
  if (override) {
    return override;
  }
  return catalogReportParameterVariable(parameterName);
}

/**
 * Stretchy variable for GET /runreports/{name} query keys (`R_{variable}`).
 * Uses FullParameterList metadata when present; never uses per-report SQL placeholder names.
 */
export function reportRunQueryParameterVariable(
  parameterName: string,
  metadataVariable?: string
): string | undefined {
  const name = parameterName.trim();
  const metaVar = metadataVariable?.trim();
  if (metaVar && metaVar !== name) {
    return metaVar;
  }
  return catalogReportParameterVariable(name);
}

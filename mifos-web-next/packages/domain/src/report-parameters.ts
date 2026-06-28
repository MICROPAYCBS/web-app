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

export function catalogReportParameterVariable(parameterName: string): string | undefined {
  return STRETCHY_PARAMETER_VARIABLES[parameterName as StretchyParameterName];
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

export function isReportParameterDate(parameter: {
  parameterDisplayType?: string;
  parameterType?: string;
  parameterName?: string;
}): boolean {
  const displayType = parameter.parameterDisplayType?.trim().toLowerCase();
  if (displayType === 'date' || parameter.parameterType?.trim().toLowerCase() === 'date') {
    return true;
  }
  const name = parameter.parameterName?.trim().toLowerCase();
  return Boolean(name && (name.endsWith('dateselect') || name === 'asondate'));
}

/** Name substituted in report SQL / passed to the reporting engine at run time. */
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

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

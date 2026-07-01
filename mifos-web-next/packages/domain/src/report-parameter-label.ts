/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface ReportParameterLike {
  parameterName?: string;
  reportParameterName?: string;
  parameterLabel?: string;
  displayLabel?: string;
}

const KNOWN_PARAMETER_LABELS: Record<string, string> = {
  startDateSelect: 'Start Date',
  endDateSelect: 'End Date',
  obligDateTypeSelect: 'Obligation Date Type',
  OfficeIdSelectOne: 'Branch',
  loanOfficerIdSelectAll: 'Loan Officer',
  currencyIdSelectAll: 'Currency',
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
  SavingsAccountSubStatus: 'Savings Account Status'
};

function formatParameterName(parameterName: string): string {
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

/** Resolves the user-facing label for a Fineract report parameter. */
export function resolveReportParameterDisplayLabel(parameter: ReportParameterLike): string {
  if (parameter.displayLabel?.trim()) {
    return parameter.displayLabel.trim();
  }

  if (parameter.reportParameterName?.trim()) {
    return parameter.reportParameterName.trim();
  }

  if (parameter.parameterLabel?.trim() && parameter.parameterLabel.trim().toLowerCase() !== 'n/a') {
    return parameter.parameterLabel.trim();
  }

  if (parameter.parameterName) {
    return KNOWN_PARAMETER_LABELS[parameter.parameterName] ?? formatParameterName(parameter.parameterName);
  }

  return '';
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIncomeSource } from '@mifos/api-client';
import type { IncomeSourceInput } from '@mifos/validation';
import { formatFineractDateArray, fromFineractDateArray, toFineractDate } from '@/lib/fineract/dates';

export function formatIncomeSourceSummary(source: FineractClientIncomeSource | IncomeSourceInput): string {
  const parts: string[] = [];
  if ('incomeSourceType' in source && source.incomeSourceType) {
    parts.push(source.incomeSourceType);
  }
  if ('employerBusinessName' in source && source.employerBusinessName?.trim()) {
    parts.push(source.employerBusinessName.trim());
  }
  if ('monthlyIncome' in source && source.monthlyIncome != null) {
    const currency = 'incomeCurrencyCode' in source ? source.incomeCurrencyCode : undefined;
    parts.push(`${currency ? `${currency} ` : ''}${source.monthlyIncome.toLocaleString()}/mo`);
  }
  if ('isPrimarySource' in source && source.isPrimarySource) {
    parts.push('Primary');
  }
  return parts.join(' · ') || 'Income source';
}

export function incomeSourceInputDisplayName(
  source: IncomeSourceInput,
  incomeSourceTypeLabel?: string
): string {
  return formatIncomeSourceSummary({
    ...source,
    incomeSourceType: incomeSourceTypeLabel
  } as FineractClientIncomeSource);
}

export function toIncomeSourceInput(source: FineractClientIncomeSource): IncomeSourceInput {
  const toDate = (value?: number[] | string) => {
    if (Array.isArray(value)) {
      const date = fromFineractDateArray(value);
      return date ? toFineractDate(date) : undefined;
    }
    return typeof value === 'string' ? value : undefined;
  };

  return {
    incomeSourceTypeId: source.incomeSourceTypeId ?? 0,
    sourceOfFundsId: source.sourceOfFundsId,
    employerBusinessName: source.employerBusinessName ?? '',
    employerAddress: source.employerAddress ?? '',
    occupation: source.occupation ?? '',
    subIndustryId: source.subIndustryId,
    monthlyIncome: source.monthlyIncome,
    incomeCurrencyCode: source.incomeCurrencyCode ?? '',
    incomeFrequencyId: source.incomeFrequencyId,
    startDate: toDate(source.startDate),
    endDate: toDate(source.endDate),
    isPrimarySource: source.isPrimarySource ?? false,
    verificationStatusId: source.verificationStatusId,
    supportingDocument: source.supportingDocument ?? '',
    remarks: source.remarks ?? ''
  };
}

export function formatIncomeSourceDates(source: FineractClientIncomeSource): string | undefined {
  const start = Array.isArray(source.startDate)
    ? formatFineractDateArray(source.startDate)
    : source.startDate;
  const end = Array.isArray(source.endDate) ? formatFineractDateArray(source.endDate) : source.endDate;
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start ?? end ?? undefined;
}

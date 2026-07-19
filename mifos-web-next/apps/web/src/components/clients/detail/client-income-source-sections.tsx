/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIncomeSource } from '@mifos/api-client';
import type { IncomeSourceInput } from '@mifos/validation';
import type { ReactNode } from 'react';
import type { CollectionDetailMode } from '@/components/composites';
import { CollectionItemFieldDetails, DetailField, DetailFieldGrid, TextValue } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

export function formatIncomeSourceExtendedSummary(source: FineractClientIncomeSource): string {
  const parts = [
    source.sourceOfFunds,
    source.employerAddress,
    source.subIndustryName,
    source.occupation
  ].filter(Boolean);
  return parts.join(' · ') || formatIncomeSourceSummary(source);
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

function formatDateValue(value?: number[] | string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return formatFineractDateArray(value) ?? undefined;
  }
  return value;
}

function formatMonthlyIncome(source: FineractClientIncomeSource): string | undefined {
  if (source.monthlyIncome == null) {
    return undefined;
  }
  const currency = source.incomeCurrencyCode?.trim();
  const amount = source.monthlyIncome.toLocaleString();
  return currency ? `${currency} ${amount}` : amount;
}

export function ClientIncomeSourceSections({ source }: { source: FineractClientIncomeSource }) {
  return (
    <DetailFieldGrid>
      <DetailField label="Income type">
        <TextValue value={source.incomeSourceType} />
      </DetailField>
      <DetailField label="Source of funds">
        <TextValue value={source.sourceOfFunds} />
      </DetailField>
      <DetailField label="Employer / business">
        <TextValue value={source.employerBusinessName} />
      </DetailField>
      <DetailField label="Employer address">
        <TextValue value={source.employerAddress} />
      </DetailField>
      <DetailField label="Occupation">
        <TextValue value={source.occupation} />
      </DetailField>
      <DetailField label="Sub-industry">
        <TextValue value={source.subIndustryName} />
      </DetailField>
      <DetailField label="Monthly income">
        <TextValue value={formatMonthlyIncome(source)} />
      </DetailField>
      <DetailField label="Income frequency">
        <TextValue value={source.incomeFrequency} />
      </DetailField>
      <DetailField label="Start date">
        <TextValue value={formatDateValue(source.startDate)} />
      </DetailField>
      <DetailField label="End date">
        <TextValue value={formatDateValue(source.endDate)} />
      </DetailField>
      <DetailField label="Primary source">
        <TextValue value={source.isPrimarySource ? 'Yes' : 'No'} />
      </DetailField>
      <DetailField label="Verification status">
        <TextValue value={source.verificationStatus} />
      </DetailField>
      <DetailField label="Supporting document">
        <TextValue value={source.supportingDocument} />
      </DetailField>
      <DetailField label="Remarks">
        <TextValue value={source.remarks} />
      </DetailField>
    </DetailFieldGrid>
  );
}

function IncomeSourceActions({
  canUpdate,
  onEdit,
  onDelete,
  className
}: {
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  if (!canUpdate) {
    return null;
  }
  return (
    <div className={cn('flex shrink-0 gap-2', className)}>
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}

export function ClientIncomeSourceListItem({
  source,
  summary,
  detailMode,
  canUpdate,
  onEdit,
  onDelete,
  className
}: {
  source: FineractClientIncomeSource;
  summary: string;
  detailMode?: CollectionDetailMode;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const body =
    detailMode ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        <ClientIncomeSourceSections source={source} />
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-lg border p-4', className)}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{formatIncomeSourceSummary(source)}</p>
          {source.isPrimarySource ? <Badge variant="secondary">Primary</Badge> : null}
        </div>
        {body}
      </div>
      <IncomeSourceActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function ClientIncomeSourceGridCard({
  source,
  summary,
  detailMode,
  canUpdate,
  onEdit,
  onDelete
}: {
  source: FineractClientIncomeSource;
  summary: string;
  detailMode?: CollectionDetailMode;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const body =
    detailMode ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        <ClientIncomeSourceSections source={source} />
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{formatIncomeSourceSummary(source)}</span>
          {source.isPrimarySource ? <Badge variant="secondary">Primary</Badge> : null}
        </CardTitle>
        {detailMode ? null : <CardDescription>{summary}</CardDescription>}
        <CardAction>
          <IncomeSourceActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

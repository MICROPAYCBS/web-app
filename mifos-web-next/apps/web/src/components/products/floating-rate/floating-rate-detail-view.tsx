'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRateDetail } from '@mifos/api-client';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import {
  formatFloatingRateDate,
  formatFloatingRateInterestRate,
  formatFloatingRateYesNo,
  sortFloatingRatePeriods
} from '@/lib/fineract/floating-rate-display';
import {
  floatingRateEditPath,
  floatingRatesListPath
} from '@/lib/fineract/floating-rate-paths';
import { cn } from '@/lib/utils';

export function FloatingRateDetailView({
  rate,
  canEdit
}: {
  rate: FloatingRateDetail;
  canEdit: boolean;
}) {
  const periods = sortFloatingRatePeriods(rate.ratePeriods ?? []);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href={floatingRatesListPath()} label="Back to floating rates" />}
          title={rate.name ?? `Floating rate #${rate.id}`}
          actions={
            canEdit ? (
              <Link
                href={floatingRateEditPath(rate.id)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            ) : null
          }
        />
      }
    >
      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Name">{rate.name ?? '—'}</DetailField>
          <DetailField label="Base lending rate">
            {formatFloatingRateYesNo(rate.isBaseLendingRate ?? false)}
          </DetailField>
          <DetailField label="Active">{formatFloatingRateYesNo(rate.isActive ?? false)}</DetailField>
          <DetailField label="Created by">{rate.createdBy ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Floating rate periods">
        {periods.length ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">From date</th>
                  <th className="px-3 py-2 text-right font-medium">Interest rate</th>
                  <th className="px-3 py-2 text-left font-medium">Differential</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period, index) => (
                  <tr
                    key={`${period.id ?? 'period'}-${period.fromDate}-${index}`}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2">{formatFloatingRateDate(period.fromDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatFloatingRateInterestRate(period.interestRate)}
                    </td>
                    <td className="px-3 py-2">
                      {formatFloatingRateYesNo(period.isDifferentialToBaseLendingRate ?? false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No rate periods defined.</p>
        )}
      </DetailSection>
    </DetailPage>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentDetail } from '@mifos/api-client';
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
  formatTaxAccountType,
  formatTaxDate,
  formatTaxGlAccount
} from '@/lib/fineract/tax-display';
import { taxComponentEditPath, taxComponentsListPath } from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

export function TaxComponentDetailView({
  component,
  canEdit
}: {
  component: TaxComponentDetail;
  canEdit: boolean;
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href={taxComponentsListPath()} label="Back to tax components" />
          }
          title={component.name ?? `Tax component #${component.id}`}
          actions={
            canEdit ? (
              <Link
                href={taxComponentEditPath(component.id)}
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
          <DetailField label="Name">{component.name ?? '—'}</DetailField>
          <DetailField label="Percentage">
            {component.percentage !== undefined ? `${component.percentage}%` : '—'}
          </DetailField>
          <DetailField label="Start date">{formatTaxDate(component.startDate)}</DetailField>
          <DetailField label="Debit account type">
            {formatTaxAccountType(component.debitAccountType)}
          </DetailField>
          <DetailField label="Debit account">
            {formatTaxGlAccount(component.debitAccount)}
          </DetailField>
          <DetailField label="Credit account type">
            {formatTaxAccountType(component.creditAccountType)}
          </DetailField>
          <DetailField label="Credit account">
            {formatTaxGlAccount(component.creditAccount)}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}

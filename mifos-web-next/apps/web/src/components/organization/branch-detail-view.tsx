'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeDetail } from '@mifos/api-client';
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
import { branchDisplayName } from '@/lib/fineract/office-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

export function BranchDetailView({
  office,
  canEdit
}: {
  office: FineractOfficeDetail;
  canEdit: boolean;
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/organization/offices" label="Back to branches" />}
          title={branchDisplayName(office)}
          actions={
            canEdit ? (
              <Link
                href={`/organization/offices/${office.id}?edit=1`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-2 size-4" />
                Edit branch
              </Link>
            ) : null
          }
        />
      }
    >
      <DetailSection title="Branch information">
        <DetailFieldGrid>
          <DetailField label="Name">{branchDisplayName(office)}</DetailField>
          <DetailField label="Parent branch">{office.parentName ?? '—'}</DetailField>
          <DetailField label="Opening date">
            {formatFineractDateArray(office.openingDate) ?? '—'}
          </DetailField>
          <DetailField label="External ID">{office.externalId?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}

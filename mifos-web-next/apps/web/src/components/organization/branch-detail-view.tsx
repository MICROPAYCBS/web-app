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
import { branchCodeLabel } from '@/lib/fineract/branch-profile-form';
import { branchDisplayName } from '@/lib/fineract/office-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function formatCurrency(value?: number) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function BranchDetailView({
  office,
  canEdit
}: {
  office: FineractOfficeDetail;
  canEdit: boolean;
}) {
  const profile = office.branchProfile;
  const branchCode = branchCodeLabel(office);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/organization/offices" label="Back to branches" />}
          title={branchDisplayName(office)}
          meta={branchCode ? `Branch code ${branchCode}` : undefined}
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
      <DetailSection title="Branch details">
        <DetailFieldGrid>
          <DetailField label="Branch name">{branchDisplayName(office)}</DetailField>
          <DetailField label="Branch code">{branchCode ?? '—'}</DetailField>
          <DetailField label="Branch type">{profile?.branchType ?? '—'}</DetailField>
          <DetailField label="Status">{profile?.status ?? '—'}</DetailField>
          <DetailField label="Parent branch">{office.parentName ?? '—'}</DetailField>
          <DetailField label="Opening date">
            {formatFineractDateArray(office.openingDate) ?? '—'}
          </DetailField>
          <DetailField label="External ID">{office.externalId?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Location & contact">
        <DetailFieldGrid>
          <DetailField label="Address">{profile?.address ?? '—'}</DetailField>
          <DetailField label="City">{profile?.city ?? '—'}</DetailField>
          <DetailField label="Region">{profile?.regionCode ?? '—'}</DetailField>
          <DetailField label="Country code">{profile?.countryCode ?? '—'}</DetailField>
          <DetailField label="Phone">{profile?.phoneNo ?? '—'}</DetailField>
          <DetailField label="Email">{profile?.emailAddress ?? '—'}</DetailField>
          <DetailField label="Latitude">{profile?.latitude ?? '—'}</DetailField>
          <DetailField label="Longitude">{profile?.longitude ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Operations">
        <DetailFieldGrid>
          <DetailField label="Branch manager">{profile?.managerStaffName ?? '—'}</DetailField>
          <DetailField label="SWIFT / BIC">{profile?.swiftCode ?? '—'}</DetailField>
          <DetailField label="Cash limit">{formatCurrency(profile?.cashLimit)}</DetailField>
          <DetailField label="Working hours">{profile?.workingHours ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}

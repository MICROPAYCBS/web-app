'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaff } from '@mifos/api-client';
import { formatUgandaPhonePresentation } from '@mifos/validation';
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
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function employeeName(staff: FineractStaff): string {
  return [staff.firstname, staff.lastname].filter(Boolean).join(' ').trim() || `Employee ${staff.id}`;
}

export function EmployeeDetailView({
  staff,
  canEdit
}: {
  staff: FineractStaff;
  canEdit: boolean;
}) {
  const active = staff.isActive === true;

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/organization/employees" label="Back to employees" />}
          title={employeeName(staff)}
          status={{
            label: active ? 'Active' : 'Inactive',
            variant: active ? 'default' : 'secondary'
          }}
          actions={
            canEdit ? (
              <Link
                href={`/organization/employees/${staff.id}?edit=1`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-2 size-4" />
                Edit employee
              </Link>
            ) : null
          }
        />
      }
    >
      <DetailSection title="Employee information">
        <DetailFieldGrid>
          <DetailField label="First name">{staff.firstname ?? '—'}</DetailField>
          <DetailField label="Last name">{staff.lastname ?? '—'}</DetailField>
          <DetailField label="Branch">{staff.officeName ?? '—'}</DetailField>
          <DetailField label="Loan officer">{formatYesNo(staff.isLoanOfficer)}</DetailField>
          <DetailField label="Phone number">
            {formatUgandaPhonePresentation(staff.mobileNo) || '—'}
          </DetailField>
          <DetailField label="Joining date">
            {formatFineractDateArray(staff.joiningDate) ?? '—'}
          </DetailField>
          <DetailField label="Status">{active ? 'Active' : 'Inactive'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorDetail } from '@mifos/api-client';
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
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  LOAN_ORIGINATOR_LIST_PATH,
  loanOriginatorEditPath
} from '@/lib/fineract/loan-originator-paths';
import {
  formatLoanOriginatorStatus,
  loanOriginatorStatusVariant
} from '@/lib/fineract/loan-originator-display';
import { cn } from '@/lib/utils';

export function LoanOriginatorDetailView({
  originator,
  canEdit
}: {
  originator: LoanOriginatorDetail;
  canEdit: boolean;
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href={LOAN_ORIGINATOR_LIST_PATH} label="Back to loan originators" />
          }
          title={originator.name}
          actions={
            canEdit ? (
              <Link
                href={loanOriginatorEditPath(originator.id)}
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
      <DetailSection title="Overview">
        <DetailFieldGrid>
          <DetailField label="Name">{originator.name}</DetailField>
          <DetailField label="External ID">{originator.externalId?.trim() || '—'}</DetailField>
          <DetailField label="Status">
            <Badge variant={loanOriginatorStatusVariant(originator.status)}>
              {formatLoanOriginatorStatus(originator.status)}
            </Badge>
          </DetailField>
          <DetailField label="Originator type">
            {originator.originatorType?.name ?? '—'}
          </DetailField>
          <DetailField label="Channel type">{originator.channelType?.name ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}

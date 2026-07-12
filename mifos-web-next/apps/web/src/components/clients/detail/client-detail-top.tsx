/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { Calendar, Hash, Mail, Phone, UserRound, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { ClientProfileAvatar } from '@/components/clients/detail/client-profile-avatar';
import { ClientSignatureView } from '@/components/clients/detail/client-signature-view';
import { DetailHeader, EmptyValue } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { ClientDetailActionsMenu } from '@/components/clients/detail/client-detail-actions-menu';
import { enumOptionLabel, isClientEntity } from '@/lib/fineract/client-detail-labels';
import { formatCustomerClassLabel } from '@/lib/fineract/customer-class-eligibility';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { ageFromFineractDateOfBirth, formatAgeYearsLabel, formatFineractDateArray } from '@/lib/fineract/dates';
import {
  hasPendingCheckerAction,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';

function ClientHeaderDates({
  submittedOn,
  activatedOn,
  closedOn,
  birthOrIncorpLabel,
  birthOrIncorpDate,
  birthOrIncorpAgeYears
}: {
  submittedOn?: string | null;
  activatedOn?: string | null;
  closedOn?: string | null;
  birthOrIncorpLabel: string;
  birthOrIncorpDate?: string | null;
  /** Shown beside date of birth for individual customers only. */
  birthOrIncorpAgeYears?: number;
}) {
  const itemClassName = 'inline-flex min-w-0 items-center gap-1.5 text-muted-foreground';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className={itemClassName}>
        <Calendar className="size-4 shrink-0" aria-hidden />
        <span>
          Submitted <span className="text-foreground">{submittedOn ?? '—'}</span>
        </span>
      </span>
      <span className={itemClassName}>
        <Calendar className="size-4 shrink-0" aria-hidden />
        <span>
          Activated <span className="text-foreground">{activatedOn ?? '—'}</span>
        </span>
      </span>
      {closedOn ? (
        <span className={itemClassName}>
          <Calendar className="size-4 shrink-0" aria-hidden />
          <span>
            Closed <span className="text-foreground">{closedOn}</span>
          </span>
        </span>
      ) : null}
      <span className={itemClassName}>
        <Calendar className="size-4 shrink-0" aria-hidden />
        <span>
          {birthOrIncorpLabel}{' '}
          <span className="text-foreground">
            {birthOrIncorpDate ?? '—'}
            {birthOrIncorpDate && birthOrIncorpAgeYears != null ? (
              <span className="text-muted-foreground">
                {' '}
                ({formatAgeYearsLabel(birthOrIncorpAgeYears)})
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </div>
  );
}

function ClientHeaderKeyInfo({
  mobileNo,
  emailAddress,
  externalId,
  staffName
}: {
  mobileNo?: string;
  emailAddress?: string;
  externalId?: string;
  staffName?: string;
}) {
  const mobile = mobileNo?.trim();
  const email = emailAddress?.trim();
  const external = externalId?.trim();
  const staff = staffName?.trim();
  const linkClassName =
    'inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground';
  const missingClassName = 'inline-flex min-w-0 items-center gap-1.5 text-muted-foreground';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {mobile ? (
        <a href={`tel:${mobile}`} className={linkClassName} aria-label={`Mobile ${mobile}`}>
          <Phone className="size-4 shrink-0" aria-hidden />
          <span>{mobile}</span>
        </a>
      ) : (
        <span className={missingClassName} aria-label="Mobile not provided">
          <Phone className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
      {email ? (
        <a href={`mailto:${email}`} className={linkClassName} aria-label={`Email ${email}`}>
          <Mail className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      ) : (
        <span className={missingClassName} aria-label="Email not provided">
          <Mail className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
      {external ? (
        <span className={missingClassName} aria-label={`External ID ${external}`}>
          <Hash className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{external}</span>
        </span>
      ) : (
        <span className={missingClassName} aria-label="External ID not provided">
          <Hash className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
      {staff ? (
        <span className={missingClassName} aria-label={`Relationship officer ${staff}`}>
          <UserRound className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{staff}</span>
        </span>
      ) : (
        <span className={missingClassName} aria-label="Relationship officer not assigned">
          <UserRound className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
    </div>
  );
}

function ClientHeaderProfiling({
  clientType,
  customerClassName
}: {
  clientType?: string;
  customerClassName?: string;
}) {
  const parts = [clientType, customerClassName].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {parts.join(' · ')}
    </p>
  );
}

function ClientHeaderGroups({ groups }: { groups: { id: number; name: string }[] }) {
  if (groups.length === 0) {
    return null;
  }

  const itemClassName = 'inline-flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground';

  return (
    <p className={itemClassName}>
      <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Member of{' '}
        <span className="text-foreground">{groups.map((group) => group.name).join(', ')}</span>
      </span>
    </p>
  );
}

export function ClientDetailTop({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  hasSignature = false,
  signatureDocumentId,
  pendingCheckerActions = [],
  summary
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  hasSignature?: boolean;
  signatureDocumentId?: number;
  pendingCheckerActions?: ResourcePendingCheckerAction[];
  summary?: ReactNode;
}) {
  const name = clientDisplayName(client);
  const submittedLabel = formatFineractDateArray(client.timeline?.submittedOnDate);
  const activatedLabel = formatFineractDateArray(client.timeline?.activatedOnDate);
  const dobLabel = formatFineractDateArray(client.dateOfBirth);
  const closedLabel = formatFineractDateArray(client.timeline?.closedOnDate);
  const isEntity = isClientEntity(client);
  const birthOrIncorpAgeYears = isEntity
    ? undefined
    : ageFromFineractDateOfBirth(client.dateOfBirth);
  const legalFormLabel = enumOptionLabel(client.legalForm);
  const groups = client.groups?.filter((group) => group.name?.trim()) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-1">
          <ClientProfileAvatar
            client={client}
            initialImageSrc={initialImageSrc}
            canCreateImage={canCreateImage}
            canDeleteImage={canDeleteImage}
          />
          <ClientSignatureView
            clientId={String(client.id)}
            hasSignature={hasSignature}
            signatureDocumentId={signatureDocumentId}
            canCreateImage={canCreateImage}
            canDeleteImage={canDeleteImage}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <DetailHeader
            title={name}
            status={{
              label: client.status?.value ?? 'Unknown',
              variant: 'secondary'
            }}
            meta={
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    Customer Number {client.accountNo}
                    {client.officeName ? ` · ${client.officeName}` : ''}
                    {legalFormLabel ? ` · ${legalFormLabel}` : ''}
                  </span>
                  {!isEntity && client.isStaff ? (
                    <Badge variant="outline">Staff customer</Badge>
                  ) : null}
                </div>
                <ClientHeaderProfiling
                  clientType={enumOptionLabel(client.clientType)}
                  customerClassName={formatCustomerClassLabel(client.customerClass)}
                />
                <ClientHeaderGroups groups={groups} />
                <ClientHeaderDates
                  submittedOn={submittedLabel}
                  activatedOn={activatedLabel}
                  closedOn={closedLabel}
                  birthOrIncorpLabel={isEntity ? 'Incorporation date' : 'Date of birth'}
                  birthOrIncorpDate={dobLabel}
                  birthOrIncorpAgeYears={birthOrIncorpAgeYears}
                />
                <ClientHeaderKeyInfo
                  mobileNo={client.mobileNo}
                  emailAddress={client.emailAddress}
                  externalId={client.externalId}
                  staffName={client.staffName}
                />
              </div>
            }
            actions={
              <ClientDetailActionsMenu
                client={client}
                hasSignature={hasSignature}
                signatureDocumentId={signatureDocumentId}
                pendingCheckerActions={pendingCheckerActions}
              />
            }
          />

          {summary ?? null}
        </div>
      </div>
    </div>
  );
}

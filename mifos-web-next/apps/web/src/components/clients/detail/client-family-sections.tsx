/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientFamilyMember } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import type { ReactNode } from 'react';
import type { CollectionDetailMode } from '@/components/composites';
import { CollectionItemFieldDetails, DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function familyMemberDisplayName(member: FineractClientFamilyMember): string {
  return [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
}

export function familyMemberInputDisplayName(member: FamilyMemberInput): string {
  return [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
}

export function formatFamilyMemberSummary(member: {
  relationship?: string;
  gender?: string;
  mobileNumber?: string;
  emailAddress?: string;
  isDependent?: boolean;
}): string {
  const parts = [member.relationship, member.gender, member.mobileNumber, member.emailAddress].filter(Boolean);
  if (member.isDependent) {
    parts.push('Dependent');
  }
  return parts.join(' · ') || 'Next of kin';
}

export function formatFamilyMemberInputSummary(
  member: FamilyMemberInput,
  relationshipLabel?: string
): string {
  return formatFamilyMemberSummary({
    relationship: relationshipLabel,
    mobileNumber: member.mobileNumber ?? undefined,
    emailAddress: member.emailAddress ?? undefined,
    isDependent: member.isDependent
  });
}

function FamilyCollectionActions({
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
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <button
        type="button"
        className="text-sm font-medium text-primary hover:underline"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="text-sm font-medium text-destructive hover:underline"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

export function ClientFamilyListItem({
  title,
  summary,
  detailMode,
  details,
  isDependent,
  canUpdate,
  onEdit,
  onDelete,
  className
}: {
  title: string;
  summary: string;
  detailMode?: CollectionDetailMode;
  details?: ReactNode;
  isDependent?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const body =
    detailMode && details ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        {details}
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <div className={cn('flex items-start justify-between gap-3 bg-card px-4 py-3', className)}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{title}</p>
          {isDependent ? <Badge variant="secondary">Dependent</Badge> : null}
        </div>
        {body}
      </div>
      <FamilyCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function ClientFamilyGridCard({
  title,
  summary,
  detailMode,
  details,
  isDependent,
  canUpdate,
  onEdit,
  onDelete
}: {
  title: string;
  summary: string;
  detailMode?: CollectionDetailMode;
  details?: ReactNode;
  isDependent?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const body =
    detailMode && details ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        {details}
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {isDependent ? <Badge variant="secondary">Dependent</Badge> : null}
        </CardTitle>
        {!(detailMode && details) ? <CardDescription>{summary}</CardDescription> : null}
        <CardAction>
          <FamilyCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function formatDateOfBirth(value: FineractClientFamilyMember['dateOfBirth']): string | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return formatFineractDateArray(value) ?? undefined;
  }
  return value.trim() === '' ? undefined : value;
}

function hasFamilyMemberDateOfBirth(
  value: FineractClientFamilyMember['dateOfBirth']
): boolean {
  return formatDateOfBirth(value) != null;
}

function formatFamilyMemberAge(
  member: Pick<FineractClientFamilyMember, 'age' | 'dateOfBirth'>
): string | undefined {
  if (!hasFamilyMemberDateOfBirth(member.dateOfBirth)) {
    return undefined;
  }
  if (member.age == null) {
    return undefined;
  }
  return String(member.age);
}

export function ClientFamilySections({ member }: { member: FineractClientFamilyMember }) {
  const dobLabel = formatDateOfBirth(member.dateOfBirth);
  const ageLabel = formatFamilyMemberAge(member);

  return (
    <DetailFieldGrid>
      <DetailField label="First name">
        <TextValue value={member.firstName} />
      </DetailField>
      {member.middleName ? (
        <DetailField label="Middle name">
          <TextValue value={member.middleName} />
        </DetailField>
      ) : null}
      <DetailField label="Last name">
        <TextValue value={member.lastName} />
      </DetailField>
      <DetailField label="Relationship">
        <TextValue value={member.relationship} />
      </DetailField>
      <DetailField label="Gender">
        <TextValue value={member.gender} />
      </DetailField>
      {member.qualification ? (
        <DetailField label="Qualification">
          <TextValue value={member.qualification} />
        </DetailField>
      ) : null}
      {member.profession ? (
        <DetailField label="Profession">
          <TextValue value={member.profession} />
        </DetailField>
      ) : null}
      {member.maritalStatus ? (
        <DetailField label="Marital status">
          <TextValue value={member.maritalStatus} />
        </DetailField>
      ) : null}
      {member.mobileNumber ? (
        <DetailField label="Telephone">
          <TextValue value={member.mobileNumber} />
        </DetailField>
      ) : null}
      {member.emailAddress ? (
        <DetailField label="Email">
          <TextValue value={member.emailAddress} />
        </DetailField>
      ) : null}
      {member.address ? (
        <DetailField label="Address" className="sm:col-span-2">
          <TextValue value={member.address} />
        </DetailField>
      ) : null}
      <DetailField label="Age">
        <TextValue value={ageLabel} />
      </DetailField>
      <DetailField label="Date of birth">
        <TextValue value={dobLabel} />
      </DetailField>
      <DetailField label="Dependent">
        <TextValue value={member.isDependent ? 'Yes' : 'No'} />
      </DetailField>
    </DetailFieldGrid>
  );
}

export function ClientFamilyPanel({
  member,
  canUpdate,
  onEdit,
  onDelete
}: {
  member: FineractClientFamilyMember;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DetailSection
      title={familyMemberDisplayName(member)}
      description={member.relationship}
      actions={
        canUpdate ? (
          <div className="flex gap-3">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-sm font-medium text-destructive hover:underline"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        ) : null
      }
    >
      <ClientFamilySections member={member} />
    </DetailSection>
  );
}

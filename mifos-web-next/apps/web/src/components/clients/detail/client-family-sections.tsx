/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientFamilyMember } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  isDependent?: boolean;
}): string {
  const parts = [member.relationship, member.gender, member.mobileNumber].filter(Boolean);
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
  isDependent,
  canUpdate,
  onEdit,
  onDelete,
  className
}: {
  title: string;
  summary: string;
  isDependent?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 bg-card px-4 py-3', className)}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{title}</p>
          {isDependent ? <Badge variant="secondary">Dependent</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <FamilyCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function ClientFamilyGridCard({
  title,
  summary,
  isDependent,
  canUpdate,
  onEdit,
  onDelete
}: {
  title: string;
  summary: string;
  isDependent?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {isDependent ? <Badge variant="secondary">Dependent</Badge> : null}
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
        <CardAction>
          <FamilyCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
        </CardAction>
      </CardHeader>
    </Card>
  );
}

function formatDateOfBirth(value: FineractClientFamilyMember['dateOfBirth']): string | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return formatFineractDateArray(value);
  }
  return value;
}

export function ClientFamilySections({ member }: { member: FineractClientFamilyMember }) {
  const dobLabel = formatDateOfBirth(member.dateOfBirth);

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
        <DetailField label="Mobile">
          <TextValue value={member.mobileNumber} />
        </DetailField>
      ) : null}
      {member.age != null ? (
        <DetailField label="Age">
          <TextValue value={String(member.age)} />
        </DetailField>
      ) : null}
      {dobLabel ? (
        <DetailField label="Date of birth">
          <TextValue value={dobLabel} />
        </DetailField>
      ) : null}
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

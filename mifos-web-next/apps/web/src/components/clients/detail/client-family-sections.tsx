/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientFamilyMember } from '@mifos/api-client';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function familyMemberDisplayName(member: FineractClientFamilyMember): string {
  return [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
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

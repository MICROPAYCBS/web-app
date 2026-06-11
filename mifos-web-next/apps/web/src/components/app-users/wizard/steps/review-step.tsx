'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import { yesNoLabel } from '@/lib/fineract/user-display';
import { fineractOptionLabel } from '@/lib/form/select-options';
import { canSendPasswordToEmail } from '../email';
import type { UserStepProps } from '../types';

function optionLabelById(
  options: Array<{ id: number; name?: string; nameDecorated?: string }> | undefined,
  id?: string
): string {
  if (!id) {
    return '—';
  }
  const numericId = Number(id);
  const match = options?.find((option) => option.id === numericId);
  return match ? fineractOptionLabel(match) : id;
}

export function ReviewStep({
  mode,
  template,
  draft,
  staffLabel,
  submitError
}: UserStepProps & {
  staffLabel?: string;
  submitError: string | null;
}) {
  const roleNames =
    template.availableRoles
      .filter((role) => draft.roles.includes(role.id))
      .map((role) => role.name)
      .join(', ') || '—';
  const sendPasswordToEmail = mode === 'create' && canSendPasswordToEmail(draft);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the details below before {mode === 'create' ? 'creating' : 'saving'} this user.
      </p>

      <DetailSection title="Account">
        <DetailFieldGrid columns={2}>
          <DetailField label="Login name">{draft.username || '—'}</DetailField>
          <DetailField label="Email">{draft.email || '—'}</DetailField>
          <DetailField label="First name">{draft.firstname || '—'}</DetailField>
          <DetailField label="Last name">{draft.lastname || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Access">
        <DetailFieldGrid columns={2}>
          <DetailField label="Office">
            {optionLabelById(template.allowedOffices, draft.officeId)}
          </DetailField>
          <DetailField label="Staff">{staffLabel || '—'}</DetailField>
          <DetailField label="Roles">{roleNames}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      {mode === 'create' ? (
        <DetailSection title="Sign-in">
          <DetailFieldGrid columns={2}>
            <DetailField label="Send password to email">
              {yesNoLabel(sendPasswordToEmail)}
            </DetailField>
            <DetailField label="Password never expires">
              {yesNoLabel(draft.passwordNeverExpires)}
            </DetailField>
            {!sendPasswordToEmail ? (
              <DetailField label="Password set manually">Yes</DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      ) : (
        <DetailSection title="Sign-in">
          <DetailFieldGrid columns={1}>
            <DetailField label="Password never expires">
              {yesNoLabel(draft.passwordNeverExpires)}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      )}

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
    </div>
  );
}

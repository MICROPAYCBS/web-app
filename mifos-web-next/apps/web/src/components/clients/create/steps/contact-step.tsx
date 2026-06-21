'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER } from '@mifos/validation';
import { TextField } from '@/components/composites/text-field';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

export function ContactStep({
  draft,
  errors,
  onDraftChange
}: {
  draft: CreateClientDraft;
  errors: StepErrors;
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
}) {
  const g = draft.general;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Primary and alternative phone numbers and email addresses for this customer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="mobileNo"
          label="Phone number"
          required
          type="tel"
          autoComplete="tel"
          placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
          value={g.mobileNo ?? ''}
          onChange={(v) => onDraftChange({ mobileNo: v })}
          error={errors.mobileNo}
        />

        <TextField
          id="alternativeMobileNo"
          label="Alternative phone number"
          optional
          type="tel"
          autoComplete="tel"
          placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
          value={g.alternativeMobileNo ?? ''}
          onChange={(v) => onDraftChange({ alternativeMobileNo: v })}
          error={errors.alternativeMobileNo}
        />

        <TextField
          id="emailAddress"
          label="Email"
          optional
          type="email"
          value={g.emailAddress ?? ''}
          onChange={(v) => onDraftChange({ emailAddress: v })}
          error={errors.emailAddress}
        />

        <TextField
          id="alternativeEmailAddress"
          label="Alternative email"
          optional
          type="email"
          value={g.alternativeEmailAddress ?? ''}
          onChange={(v) => onDraftChange({ alternativeEmailAddress: v })}
          error={errors.alternativeEmailAddress}
        />
      </div>
    </div>
  );
}

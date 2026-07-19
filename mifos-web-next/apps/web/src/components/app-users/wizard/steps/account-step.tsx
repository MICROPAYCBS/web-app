'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@/components/composites/text-field';
import { isValidEmail } from '../email';
import type { UserStepProps, UserWizardDraft } from '../types';

export function AccountStep({
  mode,
  draft,
  errors,
  onChange
}: UserStepProps & {
  onChange: (patch: Partial<UserWizardDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set the login name and personal details for this application user.
      </p>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <TextField
          label="Login name"
          required
          value={draft.username}
          onChange={(value) => onChange({ username: value })}
          error={errors.username}
          autoComplete="off"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            required
            value={draft.firstname}
            onChange={(value) => onChange({ firstname: value })}
            error={errors.firstname}
            autoComplete="given-name"
          />
          <TextField
            label="Last name"
            required
            value={draft.lastname}
            onChange={(value) => onChange({ lastname: value })}
            error={errors.lastname}
            autoComplete="family-name"
          />
        </div>
        <TextField
          label="Email"
          optional
          type="email"
          value={draft.email}
          onChange={(value) => {
            const patch: Partial<UserWizardDraft> = { email: value };
            if (mode === 'create' && !isValidEmail(value)) {
              patch.sendPasswordToEmail = false;
              patch.password = '';
              patch.repeatPassword = '';
            }
            onChange(patch);
          }}
          error={errors.email}
          hint={
            mode === 'create'
              ? 'Required if you want the initial password emailed on the Sign-in step.'
              : 'Optional on save. Leave blank to keep the current address.'
          }
          hintAriaLabel={mode === 'create' ? 'About email for new users' : 'About email when editing users'}
          autoComplete="email"
        />
      </div>
    </div>
  );
}

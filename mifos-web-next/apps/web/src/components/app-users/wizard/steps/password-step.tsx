'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { PasswordPolicyChecklist } from '@/components/composites/password-policy-checklist';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { usePasswordPolicy } from '@/hooks/use-password-policy';
import type { PasswordPolicyRules } from '@/lib/password-policy-validate';
import { canSendPasswordToEmail, isValidEmail } from '../email';
import type { UserStepProps, UserWizardDraft } from '../types';

export function PasswordStep({
  draft,
  errors,
  onChange,
  smtpConfigured = true,
  policy: policyProp
}: UserStepProps & {
  onChange: (patch: Partial<UserWizardDraft>) => void;
  policy?: PasswordPolicyRules;
}) {
  const { policy: fetchedPolicy, loading } = usePasswordPolicy(!policyProp);
  const policy = policyProp ?? fetchedPolicy;
  const emailAllowsSend = isValidEmail(draft.email);
  const sendPasswordAllowed = smtpConfigured && emailAllowsSend;
  const sendPasswordToEmail = canSendPasswordToEmail(draft, { smtpConfigured });
  const manualPassword = !sendPasswordToEmail;

  useEffect(() => {
    if (!sendPasswordAllowed && draft.sendPasswordToEmail) {
      onChange({ sendPasswordToEmail: false, password: '', repeatPassword: '' });
    }
  }, [sendPasswordAllowed, draft.sendPasswordToEmail, onChange]);

  const sendPasswordDescription = !smtpConfigured
    ? 'Outbound email is not configured, so a password must be set here.'
    : emailAllowsSend
      ? 'A password will be generated and emailed to the user.'
      : 'Add a valid email address on the Account step to enable this option.';

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how the user receives their initial password and set sign-in policy.
      </p>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <SwitchField
          label="Send password to email"
          checked={sendPasswordToEmail}
          disabled={!sendPasswordAllowed}
          description={sendPasswordDescription}
          onCheckedChange={(checked) =>
            onChange({
              sendPasswordToEmail: checked,
              password: '',
              repeatPassword: ''
            })
          }
        />

        {manualPassword ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Password"
                required
                type="password"
                value={draft.password}
                onChange={(value) => onChange({ password: value })}
                error={errors.password}
                autoComplete="new-password"
              />
              <TextField
                label="Confirm password"
                required
                type="password"
                value={draft.repeatPassword}
                onChange={(value) => onChange({ repeatPassword: value })}
                error={errors.repeatPassword}
                autoComplete="new-password"
              />
            </div>
            {!loading ? (
              <PasswordPolicyChecklist password={draft.password} policy={policy} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading password requirements…</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

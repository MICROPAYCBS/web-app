'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { RoleCheckboxGroup } from '@/components/app-users/role-checkbox-group';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { UserStepProps, UserWizardDraft } from '../types';

export function AccessStep({
  mode,
  template,
  draft,
  errors,
  onChange,
  staffOptions,
  staffLoading,
  staffLoadError,
  onRetryStaff
}: UserStepProps & {
  onChange: (patch: Partial<UserWizardDraft>) => void;
  staffOptions: Array<{ id: number; name: string }>;
  staffLoading: boolean;
  staffLoadError: string | null;
  onRetryStaff: () => void;
}) {
  const officeOptions = useMemo(
    () => toSelectOptions(template.allowedOffices),
    [template.allowedOffices]
  );
  const staffSelectOptions = useMemo(() => {
    const options = toSelectOptions(staffOptions);
    if (mode === 'edit') {
      return [{ value: '', label: 'None' }, ...options];
    }
    return options;
  }, [mode, staffOptions]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose the branch and roles that define where this user works and what they can do.
      </p>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <SelectField
          label="Branch"
          required
          value={draft.officeId || undefined}
          onValueChange={(value) => onChange({ officeId: value ?? '', staffId: '' })}
          options={officeOptions}
          error={errors.officeId}
          placeholder="Select branch"
        />
        <SelectField
          label="Staff"
          optional
          value={draft.staffId}
          onValueChange={(value) => onChange({ staffId: value ?? '' })}
          options={staffSelectOptions}
          disabled={!draft.officeId || staffLoading || Boolean(staffLoadError)}
          loading={staffLoading}
          loadError={staffLoadError ?? undefined}
          onRetry={draft.officeId ? onRetryStaff : undefined}
          placeholder={
            !draft.officeId
              ? 'Select a branch first'
              : staffLoading
                ? 'Loading staff…'
                : mode === 'edit'
                  ? 'No staff linked'
                  : 'Select staff (optional)'
          }
          emptyMessage={staffLoading ? 'Loading staff…' : 'No staff found for this branch.'}
        />
        <RoleCheckboxGroup
          roles={template.availableRoles}
          value={draft.roles}
          onChange={(roles) => onChange({ roles })}
          error={errors.roles}
        />
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Sign-in policy</p>
          <SwitchField
            label="Password never expires"
            checked={draft.passwordNeverExpires}
            onCheckedChange={(checked) => onChange({ passwordNeverExpires: checked })}
          />
          <SwitchField
            label="Enable login retry limit"
            checked={draft.isLoginRetriesEnabled}
            onCheckedChange={(checked) => onChange({ isLoginRetriesEnabled: checked })}
          />
          {mode === 'edit' ? (
            <SwitchField
              label="Allow password reset"
              checked={draft.isPasswordResetAllowed}
              onCheckedChange={(checked) => onChange({ isPasswordResetAllowed: checked })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

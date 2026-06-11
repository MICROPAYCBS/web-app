'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchStaffByOfficeAction } from '@/actions/app-users';
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
  onChange
}: UserStepProps & {
  onChange: (patch: Partial<UserWizardDraft>) => void;
}) {
  const [staffOptions, setStaffOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const officeOptions = useMemo(
    () => toSelectOptions(template.allowedOffices),
    [template.allowedOffices]
  );
  const staffSelectOptions = useMemo(() => toSelectOptions(staffOptions), [staffOptions]);

  useEffect(() => {
    if (!draft.officeId) {
      setStaffOptions([]);
      return;
    }

    let cancelled = false;
    setStaffLoading(true);
    void (async () => {
      const result = await fetchStaffByOfficeAction(Number(draft.officeId));
      if (cancelled) {
        return;
      }
      setStaffOptions(result.ok ? result.data : []);
      setStaffLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [draft.officeId]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose the office and roles that define where this user works and what they can do.
      </p>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <SelectField
          label="Office"
          required
          value={draft.officeId || undefined}
          onValueChange={(value) => onChange({ officeId: value ?? '', staffId: '' })}
          options={officeOptions}
          error={errors.officeId}
          placeholder="Select office"
        />
        <SelectField
          label="Staff"
          optional
          value={draft.staffId || undefined}
          onValueChange={(value) => onChange({ staffId: value ?? '' })}
          options={staffSelectOptions}
          disabled={!draft.officeId || staffLoading}
          placeholder={
            !draft.officeId
              ? 'Select an office first'
              : staffLoading
                ? 'Loading staff…'
                : 'Select staff (optional)'
          }
          emptyMessage={staffLoading ? 'Loading staff…' : 'No staff found for this office.'}
        />
        <RoleCheckboxGroup
          roles={template.availableRoles}
          value={draft.roles}
          onChange={(roles) => onChange({ roles })}
          error={errors.roles}
        />
        {mode === 'edit' ? (
          <SwitchField
            label="Password never expires"
            checked={draft.passwordNeverExpires}
            onCheckedChange={(checked) => onChange({ passwordNeverExpires: checked })}
          />
        ) : null}
      </div>
    </div>
  );
}

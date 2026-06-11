'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormLabel } from '@/components/composites/form-label';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function RoleCheckboxGroup({
  roles,
  value,
  onChange,
  disabled = false,
  error
}: {
  roles: Array<{ id: number; name: string }>;
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  function toggleRole(roleId: number, checked: boolean) {
    if (checked) {
      onChange([...value, roleId]);
      return;
    }
    onChange(value.filter((id) => id !== roleId));
  }

  return (
    <div className="space-y-2">
      <FormLabel required>Roles</FormLabel>
      <div
        className={cn(
          'max-h-48 space-y-2 overflow-y-auto rounded-lg border border-input p-3',
          error && 'border-destructive'
        )}
      >
        {roles.length ? (
          roles.map((role) => {
            const checked = value.includes(role.id);
            const inputId = `role-${role.id}`;
            return (
              <div key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={inputId}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) => toggleRole(role.id, next === true)}
                />
                <Label htmlFor={inputId} className="text-sm font-normal">
                  {role.name}
                </Label>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No roles available.</p>
        )}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

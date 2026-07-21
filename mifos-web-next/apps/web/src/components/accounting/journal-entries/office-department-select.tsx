'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { useDepartmentsForOffice } from '@/hooks/use-departments-for-office';
import { departmentSelectOptions } from '@/lib/fineract/department-select-options';

/** Department picker bound to mapped departments for a selected branch. */
export function OfficeDepartmentSelect({
  label,
  officeId,
  value,
  onValueChange,
  required = false,
  optional = true,
  disabled = false,
  error,
  nonePlaceholder = 'None'
}: {
  label: string;
  officeId?: number | null;
  value?: number;
  onValueChange: (departmentId: number | undefined) => void;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  nonePlaceholder?: string;
}) {
  const { departments, loading } = useDepartmentsForOffice(officeId);

  useEffect(() => {
    if (value == null || officeId == null || loading) {
      return;
    }
    if (!departments.some((department) => department.id === value)) {
      onValueChange(undefined);
    }
    // Parent onValueChange is typically an inline updater; depend on ids only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear stale selection after fetch
  }, [departments, loading, officeId, value]);

  return (
    <SelectField
      label={label}
      required={required}
      optional={optional}
      value={value != null ? String(value) : undefined}
      onValueChange={(next) => onValueChange(next ? Number(next) : undefined)}
      options={departmentSelectOptions(departments)}
      placeholder={
        officeId == null ? 'Select branch first' : loading ? 'Loading…' : nonePlaceholder
      }
      disabled={disabled || officeId == null || loading}
      error={error}
    />
  );
}

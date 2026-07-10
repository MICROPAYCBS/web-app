/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const DEFAULT_DEPARTMENT_ACTIVE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

/** Map Fineract EnumOptionData (`code` = true/false, `value` = label) to select options. */
export function normalizeDepartmentActiveOption(
  raw: unknown
): { value: string; label: string } | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const option = raw as Record<string, unknown>;
  const code = typeof option.code === 'string' ? option.code.trim() : '';
  if (code === 'true' || code === 'false') {
    const label =
      typeof option.value === 'string' && option.value.trim()
        ? option.value.trim()
        : code === 'true'
          ? 'Active'
          : 'Inactive';
    return { value: code, label };
  }
  if (option.value === true || option.value === 'true') {
    return { value: 'true', label: 'Active' };
  }
  if (option.value === false || option.value === 'false') {
    return { value: 'false', label: 'Inactive' };
  }
  const id = Number(option.id);
  if (id === 1) {
    return { value: 'true', label: 'Active' };
  }
  if (id === 0) {
    return { value: 'false', label: 'Inactive' };
  }
  return null;
}

export function departmentActiveFormValue(active: boolean | undefined): string {
  return active === false ? 'false' : 'true';
}

export function departmentActiveFromFormValue(value: string | undefined): boolean {
  return value === 'true';
}

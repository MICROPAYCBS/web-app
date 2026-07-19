/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const TELLER_STATUS_ACTIVE = 300;
export const TELLER_STATUS_INACTIVE = 400;

export const TELLER_STATUS_OPTIONS = [
  { id: TELLER_STATUS_ACTIVE, label: 'Active' },
  { id: TELLER_STATUS_INACTIVE, label: 'Inactive' }
] as const;

export function tellerStatusToFormValue(status: string | number | undefined): string {
  if (status === TELLER_STATUS_ACTIVE || status === '300' || status === 'ACTIVE') {
    return String(TELLER_STATUS_ACTIVE);
  }
  if (status === TELLER_STATUS_INACTIVE || status === '400' || status === 'INACTIVE') {
    return String(TELLER_STATUS_INACTIVE);
  }
  return String(TELLER_STATUS_ACTIVE);
}

export function formatTellerStatus(status: string | undefined): string {
  if (!status) {
    return '—';
  }
  return status.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive';
}

export function isTellerActive(status: string | undefined): boolean {
  return status?.toUpperCase() === 'ACTIVE';
}

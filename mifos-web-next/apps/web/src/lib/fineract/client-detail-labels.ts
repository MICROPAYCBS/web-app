/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LEGAL_FORM_ENTITY } from '@mifos/validation';

/** Client-safe label helpers for detail UI (no server-only imports). */
export function enumOptionLabel(option?: {
  name?: string;
  value?: string;
}): string | undefined {
  const label = option?.name?.trim() || option?.value?.trim();
  return label || undefined;
}

export function isClientEntity(client: { legalForm?: { id?: number } }): boolean {
  return client.legalForm?.id === LEGAL_FORM_ENTITY;
}

export function formatYesNo(value?: boolean): string {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
}

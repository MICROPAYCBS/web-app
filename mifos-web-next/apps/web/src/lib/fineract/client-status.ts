/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';

export type ClientStatusKind =
  | 'incomplete'
  | 'pending'
  | 'active'
  | 'closed'
  | 'rejected'
  | 'transferInProgress'
  | 'transferOnHold'
  | 'unknown';

function normalizeStatusText(value?: string): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

/** Maps Fineract client status labels to lifecycle menu behaviour (legacy web-app). */
export function clientStatusKind(
  client: Pick<FineractClientDetail, 'status'>
): ClientStatusKind {
  const value = normalizeStatusText(client.status?.value);
  const code = normalizeStatusText(client.status?.code);

  // Incomplete before active — code may contain "active" substrings in other statuses.
  if (value === 'incomplete' || code.includes('incomplete')) {
    return 'incomplete';
  }
  if (value === 'pending' || code.includes('pending')) {
    return 'pending';
  }
  if (value === 'active' || code.includes('active')) {
    return 'active';
  }
  if (value === 'closed' || code.includes('closed')) {
    return 'closed';
  }
  if (value === 'rejected' || code.includes('rejected')) {
    return 'rejected';
  }
  if (value === 'transfer in progress' || code.includes('transfer in progress')) {
    return 'transferInProgress';
  }
  if (value === 'transfer on hold' || code.includes('transfer on hold')) {
    return 'transferOnHold';
  }

  return 'unknown';
}

/** Fineract treats both statuses as "under transfer" (see ClientStatus.isUnderTransfer). */
export function isClientUnderTransfer(status: ClientStatusKind): boolean {
  return status === 'transferInProgress' || status === 'transferOnHold';
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';

/** Fineract `ClientStatus` enum ids used for lifecycle branching. */
export const CLIENT_STATUS_DRAFT_ID = 50;
export const CLIENT_STATUS_PENDING_ID = 100;
export const CLIENT_STATUS_ACTIVE_ID = 300;

export type ClientStatusKind =
  | 'draft'
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

/** Maps Fineract client status to lifecycle menu behaviour. Prefer status.id / code. */
export function clientStatusKind(
  client: Pick<FineractClientDetail, 'status'>
): ClientStatusKind {
  const statusId = client.status?.id;
  if (statusId === CLIENT_STATUS_DRAFT_ID) {
    return 'draft';
  }
  if (statusId === CLIENT_STATUS_PENDING_ID) {
    return 'pending';
  }
  if (statusId === CLIENT_STATUS_ACTIVE_ID) {
    return 'active';
  }

  const value = normalizeStatusText(client.status?.value);
  const code = normalizeStatusText(client.status?.code);

  // Draft before pending/active — never treat Draft as Pending.
  if (value === 'draft' || code.includes('draft') || value === 'incomplete' || code.includes('incomplete')) {
    return 'draft';
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

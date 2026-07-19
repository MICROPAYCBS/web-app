/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { PermissionKey } from '@mifos/auth';
import type { ClientActionSheetId } from '@/lib/clients/client-action-types';

/** Fineract task permissions for customer lifecycle commands (`action_ENTITY`). */
export const CLIENT_LIFECYCLE_PERMISSION_KEYS = {
  activate: 'clients.activate',
  close: 'clients.close',
  withdraw: 'clients.withdraw',
  reject: 'clients.reject',
  reactivate: 'clients.reactivate',
  'undo-rejection': 'clients.undoRejection',
  transfer: 'clients.proposeTransfer',
  'accept-transfer': 'clients.acceptTransfer',
  'reject-transfer': 'clients.rejectTransfer',
  'undo-transfer': 'clients.withdrawTransfer'
} as const satisfies Partial<Record<ClientActionSheetId, PermissionKey>>;

export function clientLifecyclePermissionKey(
  sheetId: ClientActionSheetId
): PermissionKey | undefined {
  return CLIENT_LIFECYCLE_PERMISSION_KEYS[sheetId as keyof typeof CLIENT_LIFECYCLE_PERMISSION_KEYS];
}

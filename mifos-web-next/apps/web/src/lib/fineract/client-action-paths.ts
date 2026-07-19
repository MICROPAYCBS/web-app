/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Reserved account ids that are create flows, not real accounts. */
export const CLIENT_ACCOUNT_RESERVED_IDS = new Set([
  'create',
  'create-recurring-deposits-account'
]);

export function clientActionSlug(actionName: string): string {
  return actionName.trim().toLowerCase().replace(/\s+/g, '-');
}

const ACTION_SLUG_TITLES: Record<string, string> = {
  close: 'Close',
  'transfer-client': 'Transfer customer',
  activate: 'Activate',
  withdraw: 'Withdraw',
  reject: 'Reject',
  reactivate: 'Reactivate',
  'undo-rejection': 'Undo rejection',
  'undo-transfer': 'Undo transfer',
  'accept-transfer': 'Accept transfer',
  'reject-transfer': 'Reject transfer',
  'assign-staff': 'Assign relationship officer',
  'reassign-staff': 'Reassign relationship officer',
  'create-collateral': 'Create collateral',
  'update-default-savings': 'Update default savings',
  'upload-signature': 'Upload signature',
  'delete-signature': 'Delete signature',
  'create-standing-instructions': 'Create standing instructions',
  'view-standing-instructions': 'View standing instructions'
};

export function clientActionTitleFromSlug(slug: string): string {
  const known = ACTION_SLUG_TITLES[slug];
  if (known) {
    return known;
  }
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function clientActionPath(
  clientId: string | number,
  actionName: string
): string {
  return `/clients/${clientId}/actions/${clientActionSlug(actionName)}`;
}

export function clientGeneralPath(clientId: string | number): string {
  return `/clients/${clientId}/general`;
}

export function clientEditPath(clientId: string | number): string {
  return `/clients/${clientId}/edit`;
}

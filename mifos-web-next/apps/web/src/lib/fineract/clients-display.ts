/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Client-safe display helper (no server-only imports). */
export function clientDisplayName(client: {
  displayName?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
}): string {
  if (client.displayName?.trim()) {
    return client.displayName.trim();
  }
  if (client.fullname?.trim()) {
    return client.fullname.trim();
  }
  return [client.firstname, client.lastname].filter(Boolean).join(' ').trim() || 'Client';
}

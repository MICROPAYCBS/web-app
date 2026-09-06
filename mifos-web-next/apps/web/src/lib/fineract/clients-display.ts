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
  return [client.firstname, client.lastname].filter(Boolean).join(' ').trim() || 'Customer';
}

/** Back-link label for account detail pages (savings, loans, deposits, shares). */
export function clientAccountBackLabel(clientName?: string | null): string {
  const name = clientName?.trim();
  return name ? `Back to ${name}` : 'Back to customer';
}

export function clientInitials(client: {
  displayName?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
}): string {
  const name = clientDisplayName(client);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Hide audit / journal sidebar sections when the session lacks the matching read permission. */
export function isAccountPermissionedSectionVisible(
  sectionId: string,
  options: { canViewAudits?: boolean; canViewJournals?: boolean }
): boolean {
  if (sectionId === 'audit') {
    return Boolean(options.canViewAudits);
  }
  if (sectionId === 'journalEntries') {
    return Boolean(options.canViewJournals);
  }
  return true;
}

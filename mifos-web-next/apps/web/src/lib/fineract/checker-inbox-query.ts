/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Optional Fineract GET /makercheckers query parameters (server-side narrowing). */
export type CheckerInboxSearchFilters = Record<string, string>;

export function buildCheckerInboxSearchParams(
  filters: CheckerInboxSearchFilters = {}
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) {
      params[key] = value.trim();
    }
  }
  return params;
}

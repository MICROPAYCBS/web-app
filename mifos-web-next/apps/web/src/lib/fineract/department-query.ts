/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type ListDepartmentsFilterInput = {
  /** When set, returns departments mapped to this office for posting pickers. */
  officeId?: number | string | null;
};

/** Builds query params for `GET /departments`. */
export function buildDepartmentsQueryParams(
  filters: ListDepartmentsFilterInput = {}
): Record<string, string> | undefined {
  const officeRaw =
    filters.officeId == null || filters.officeId === ''
      ? NaN
      : Number(filters.officeId);
  if (!Number.isFinite(officeRaw) || officeRaw <= 0) {
    return undefined;
  }
  return { officeId: String(officeRaw) };
}

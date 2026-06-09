/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CollateralProductActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function isCollateralProductActionError(
  result: unknown
): result is Extract<CollateralProductActionResult, { ok: false }> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    (result as CollateralProductActionResult).ok === false
  );
}

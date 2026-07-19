/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientCollateralTemplate, CollateralProductDetail } from '@mifos/api-client';

export type ClientCollateralActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function isClientCollateralActionError(
  result: unknown
): result is Extract<ClientCollateralActionResult, { ok: false }> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    (result as ClientCollateralActionResult).ok === false
  );
}

export function isCollateralProductDetail(
  result: CollateralProductDetail | ClientCollateralActionResult
): result is CollateralProductDetail {
  return !isClientCollateralActionError(result);
}

export function isClientCollateralTemplate(
  result: ClientCollateralTemplate | ClientCollateralActionResult
): result is ClientCollateralTemplate {
  return !isClientCollateralActionError(result);
}

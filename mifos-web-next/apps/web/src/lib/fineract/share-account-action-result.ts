/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandActionMeta } from '@mifos/validation';
import type { FineractShareAccountTemplate } from '@mifos/api-client';

export type ShareAccountActionResult =
  | ({ ok: true; resourceId?: number } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function isShareAccountActionError(
  result: unknown
): result is Extract<ShareAccountActionResult, { ok: false }> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    (result as ShareAccountActionResult).ok === false
  );
}

export function isShareAccountTemplate(
  result: FineractShareAccountTemplate | ShareAccountActionResult
): result is FineractShareAccountTemplate {
  return !isShareAccountActionError(result);
}

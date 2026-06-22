/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AccountTransferTemplate } from '@mifos/api-client';

export type AccountTransferActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type AccountTransferTemplateResult =
  | AccountTransferTemplate
  | Extract<AccountTransferActionResult, { ok: false }>;

export function isAccountTransferActionError(
  result: AccountTransferTemplateResult
): result is Extract<AccountTransferActionResult, { ok: false }> {
  return 'ok' in result && result.ok === false;
}

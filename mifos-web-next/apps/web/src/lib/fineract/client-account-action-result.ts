/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientDepositAccountTemplate,
  ClientLoanAccountTemplate
} from '@mifos/api-client';

export type ClientDepositAccountActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type ClientLoanAccountActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function isClientDepositAccountActionError(
  result: unknown
): result is Extract<ClientDepositAccountActionResult, { ok: false }> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    (result as ClientDepositAccountActionResult).ok === false
  );
}

export function isClientDepositAccountTemplate(
  result: ClientDepositAccountTemplate | ClientDepositAccountActionResult
): result is ClientDepositAccountTemplate {
  return !isClientDepositAccountActionError(result);
}

export function isClientLoanAccountActionError(
  result: unknown
): result is Extract<ClientLoanAccountActionResult, { ok: false }> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    (result as ClientLoanAccountActionResult).ok === false
  );
}

export function isClientLoanAccountTemplate(
  result: ClientLoanAccountTemplate | ClientLoanAccountActionResult
): result is ClientLoanAccountTemplate {
  return !isClientLoanAccountActionError(result);
}

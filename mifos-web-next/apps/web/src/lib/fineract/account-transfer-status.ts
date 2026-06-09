/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAccountStatus } from '@mifos/api-client';

function statusCode(status?: FineractClientAccountStatus): string {
  return status?.code?.trim().toLowerCase() ?? '';
}

export function accountTransferInProgress(status?: FineractClientAccountStatus): boolean {
  if (status?.transferInProgress === true) {
    return true;
  }
  const code = statusCode(status);
  return code.includes('transfer.in.progress') || code.includes('transfer_in_progress');
}

export function accountTransferOnHold(status?: FineractClientAccountStatus): boolean {
  if (status?.transferOnHold === true) {
    return true;
  }
  const code = statusCode(status);
  return code.includes('transfer.on.hold') || code.includes('transfer_on_hold');
}

export function accountUnderTransfer(status?: FineractClientAccountStatus): boolean {
  return accountTransferInProgress(status) || accountTransferOnHold(status);
}

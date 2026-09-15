/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import {
  isClientLoanAccountActionError,
  isClientLoanAccountTemplate,
  type ClientLoanAccountActionResult
} from './client-account-action-result';

export type LoanProductTemplateLoadResult =
  | { ok: true; template: ClientLoanAccountTemplate }
  | { ok: false; message: string };

export function interpretLoanProductTemplateResult(
  result: ClientLoanAccountTemplate | ClientLoanAccountActionResult
): LoanProductTemplateLoadResult {
  if (isClientLoanAccountTemplate(result)) {
    return { ok: true, template: result };
  }
  if (isClientLoanAccountActionError(result)) {
    return {
      ok: false,
      message: result.message.trim() || 'Could not load loan product options.'
    };
  }
  return { ok: false, message: 'Could not load loan product options.' };
}

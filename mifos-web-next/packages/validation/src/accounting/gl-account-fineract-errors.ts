/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractApiError } from '@mifos/api-client';
import { getFineractErrorMessage } from '@mifos/i18n';
import { GL_ACCOUNT_STRUCTURED_GL_CODE_ERROR_CODES } from './gl-account-governance';
import type { FineractActionError } from '../to-fineract-action-error';

function readGlAccountGlCodeErrorCode(body: FineractApiError | null | undefined): string | undefined {
  if (!body) {
    return undefined;
  }
  const topLevel = body.userMessageGlobalisationCode;
  if (topLevel && GL_ACCOUNT_STRUCTURED_GL_CODE_ERROR_CODES.has(topLevel)) {
    return topLevel;
  }
  for (const item of body.errors ?? []) {
    const code = item.userMessageGlobalisationCode;
    if (code && GL_ACCOUNT_STRUCTURED_GL_CODE_ERROR_CODES.has(code)) {
      return code;
    }
  }
  return undefined;
}

/** Map structured GL code domain-rule failures onto the `glCode` form field. */
export function applyGlAccountFineractFieldErrors(
  result: FineractActionError,
  body: FineractApiError | null | undefined,
  httpStatus?: number
): FineractActionError {
  if (!readGlAccountGlCodeErrorCode(body)) {
    return result;
  }

  const message = getFineractErrorMessage(body, httpStatus);
  return {
    ok: false,
    message: 'Fix the highlighted fields.',
    fieldErrors: {
      ...result.fieldErrors,
      glCode: message
    }
  };
}

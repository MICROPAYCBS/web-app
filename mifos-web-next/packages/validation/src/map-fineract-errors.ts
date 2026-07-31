/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractApiError } from '@mifos/api-client';
import { getFineractErrorMessage, resolveFineractErrorItemMessage } from '@mifos/i18n';
import { resolveCreateClientErrorField } from './clients/create-client-error-fields';

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface MappedFineractErrors {
  globalMessage: string | null;
  globalCode: string | null;
  fieldErrors: FieldError[];
}

/** Map Fineract error payload to form field errors. */
export function mapFineractErrors(body: FineractApiError | null): MappedFineractErrors {
  const fieldErrors: FieldError[] = [];

  if (body?.errors?.length) {
    for (const err of body.errors) {
      const message = resolveFineractErrorItemMessage(err);
      if (!message) {
        continue;
      }
      fieldErrors.push({
        field: resolveCreateClientErrorField(
          err.userMessageGlobalisationCode,
          err.parameterName
        ),
        message,
        code: err.userMessageGlobalisationCode
      });
    }
  }

  return {
    globalMessage: body ? getFineractErrorMessage(body) : null,
    globalCode: body?.userMessageGlobalisationCode ?? null,
    fieldErrors
  };
}

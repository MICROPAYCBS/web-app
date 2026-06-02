/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { getFineractErrorMessage } from '@mifos/i18n';
import { mapFineractErrors } from './map-fineract-errors';

export type FineractActionError = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** Map a caught error to a server-action failure result with Fineract messages preserved. */
export function toFineractActionError(err: unknown, fallback: string): FineractActionError {
  if (err instanceof FineractHttpError) {
    const mapped = mapFineractErrors(err.body);
    const fieldErrors = Object.fromEntries(mapped.fieldErrors.map((e) => [e.field, e.message]));
    const message =
      mapped.globalMessage ?? getFineractErrorMessage(err.body, err.status) ?? err.message;

    return {
      ok: false,
      message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined
    };
  }

  return {
    ok: false,
    message: err instanceof Error ? err.message : fallback
  };
}

/** Combine global and field messages for inline UI display. */
export function formatActionErrorMessage(
  message: string,
  fieldErrors?: Record<string, string>
): string {
  if (!fieldErrors || !Object.keys(fieldErrors).length) {
    return message;
  }

  const fieldParts = Object.entries(fieldErrors).map(([field, fieldMessage]) => {
    if (message.includes(fieldMessage)) {
      return fieldMessage;
    }
    return `[${field}] ${fieldMessage}`;
  });

  const uniqueParts = [...new Set([message, ...fieldParts].filter(Boolean))];
  return uniqueParts.join(' ');
}

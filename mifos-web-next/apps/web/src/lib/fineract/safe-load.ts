/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { formatErrorMessage } from '@/lib/errors/format-error-details';

export type FineractLoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status?: number };

/**
 * Fineract returned a structured API error (4xx with a user message). These are
 * expected operational failures — callers render inline UI; do not treat as crashes.
 */
export function isExpectedFineractApiError(error: unknown): error is FineractHttpError {
  return error instanceof FineractHttpError && error.status > 0 && error.status < 500;
}

function logFineractLoadFailure(error: unknown) {
  if (isExpectedFineractApiError(error)) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[fineract-load] HTTP ${error.status}: ${error.message}`);
    }
    return;
  }
  console.error('[fineract-load]', error);
}

/**
 * Run a Fineract BFF loader without throwing — for server pages that should render
 * an inline error instead of the route error boundary.
 *
 * Flow: FineractClient throws FineractHttpError on non-2xx → caught here →
 * `{ ok: false, message }` → page renders LoadErrorAlert. The error does not
 * reach the React error boundary unless the caller rethrows.
 */
export async function tryFineractLoad<T>(
  loader: () => Promise<T>,
  fallbackMessage = 'Could not load data from the server.'
): Promise<FineractLoadResult<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    logFineractLoadFailure(error);
    const message = formatErrorMessage(error);
    return {
      ok: false,
      message: message && message !== 'Something went wrong.' ? message : fallbackMessage,
      status: error instanceof FineractHttpError ? error.status : undefined
    };
  }
}

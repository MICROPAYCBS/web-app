/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatErrorMessage } from '@/lib/errors/format-error-details';

export type FineractLoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * Run a Fineract BFF loader without throwing — for server pages that should render
 * an inline error instead of the route error boundary when the server is unreachable.
 */
export async function tryFineractLoad<T>(
  loader: () => Promise<T>,
  fallbackMessage = 'Could not load data from the server.'
): Promise<FineractLoadResult<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    console.error('[fineract-load]', error);
    const message = formatErrorMessage(error);
    return {
      ok: false,
      message: message && message !== 'Something went wrong.' ? message : fallbackMessage
    };
  }
}

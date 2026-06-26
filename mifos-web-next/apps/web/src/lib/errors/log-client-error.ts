/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { captureAppError } from '@/lib/errors/capture-sentry-error';
import { emitStructuredErrorLog } from '@/lib/errors/serialize-error-for-log';

/** Structured client-side log for error boundaries (browser devtools + Sentry). */
export function logClientError(
  tag: string,
  error: unknown,
  fields: Record<string, unknown> = {}
): void {
  const context = {
    surface: 'client',
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...fields
  };
  emitStructuredErrorLog(tag, error, context);
  captureAppError(error, { tag, ...context });
}

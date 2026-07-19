/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as Sentry from '@sentry/nextjs';
import {
  logRequestError,
  type RequestErrorLogContext,
  type RequestErrorLogRequest
} from '@/lib/errors/log-request-error';
import { isSentryEnabled } from '@/sentry.shared';

type InstrumentationOnRequestError = (
  error: unknown,
  errorRequest: Readonly<RequestErrorLogRequest & { headers: NodeJS.Dict<string | string[]> }>,
  errorContext: Readonly<RequestErrorLogContext>
) => void | Promise<void>;

export async function register() {
  if (!isSentryEnabled()) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

/**
 * Server request failures: structured Vercel logs + Sentry issues.
 * Search Vercel by `"digest":"…"`; search Sentry by the same digest tag.
 */
export const onRequestError: InstrumentationOnRequestError = async (error, request, context) => {
  logRequestError(error, { path: request.path, method: request.method }, context);
  if (isSentryEnabled()) {
    await Sentry.captureRequestError(error, request, context);
  }
};

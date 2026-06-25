/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  logRequestError,
  type RequestErrorLogContext,
  type RequestErrorLogRequest
} from '@/lib/errors/log-request-error';

type InstrumentationOnRequestError = (
  error: unknown,
  errorRequest: Readonly<RequestErrorLogRequest & { headers: NodeJS.Dict<string | string[]> }>,
  errorContext: Readonly<RequestErrorLogContext>
) => void | Promise<void>;

/**
 * Next.js instrumentation hook — logs request failures on the server.
 * View output in Vercel → Project → Logs (Runtime), or `vercel logs <url>`.
 * Search by digest from the error screen, e.g. `"digest":"219758281"`.
 */
export const onRequestError: InstrumentationOnRequestError = (error, request, context) => {
  logRequestError(error, { path: request.path, method: request.method }, context);
};

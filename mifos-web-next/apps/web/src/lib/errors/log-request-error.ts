/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { emitStructuredErrorLog } from '@/lib/errors/serialize-error-for-log';

/** Mirrors Next.js `RequestErrorContext` (not exported from the public API). */
export type RequestErrorLogContext = {
  routerKind: 'Pages Router' | 'App Router';
  routePath: string;
  routeType: 'render' | 'route' | 'action' | 'proxy';
  renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
  revalidateReason: 'on-demand' | 'stale' | undefined;
};

export type RequestErrorLogRequest = {
  path: string;
  method: string;
};

/**
 * Structured server log for Next.js `onRequestError`.
 * Emits one JSON line (grep-friendly in Vercel Runtime Logs) plus the stack when present.
 *
 * Search examples in Vercel → Logs:
 * - `"tag":"request-error"`
 * - `"digest":"219758281"`
 * - `"fineractPath":"/clients/3"`
 */
export function logRequestError(
  error: unknown,
  request: RequestErrorLogRequest,
  context: RequestErrorLogContext
): void {
  emitStructuredErrorLog('request-error', error, {
    surface: 'server',
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason
  });
}

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';

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

function readDigest(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('digest' in error)) {
    return undefined;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' ? digest : undefined;
}

function readErrorName(error: unknown): string | undefined {
  return error instanceof Error ? error.name : undefined;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof FineractHttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || error.name || 'Error';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

function readErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Structured server log for Next.js `onRequestError`.
 * Emits one JSON line (grep-friendly in Vercel Runtime Logs) plus the stack when present.
 */
export function logRequestError(
  error: unknown,
  request: RequestErrorLogRequest,
  context: RequestErrorLogContext
): void {
  const payload = {
    tag: 'request-error',
    digest: readDigest(error),
    name: readErrorName(error),
    message: readErrorMessage(error),
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  };

  if (error instanceof FineractHttpError) {
    Object.assign(payload, { fineractStatus: error.status });
  }

  console.error(JSON.stringify(payload));

  const stack = readErrorStack(error);
  if (stack) {
    console.error(stack);
  }
}

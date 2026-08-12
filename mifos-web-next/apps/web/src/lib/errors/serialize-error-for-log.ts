/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';

const MAX_CAUSE_DEPTH = 5;
const MAX_FINERACT_FIELD_ERRORS = 8;

export function readErrorDigest(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('digest' in error)) {
    return undefined;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' ? digest : undefined;
}

/** Next.js `redirect()` / `notFound()` — must be rethrown from catch-all handlers. */
export function isNextNavigationError(error: unknown): boolean {
  const digest = readErrorDigest(error);
  return Boolean(
    digest && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND'))
  );
}

/** Walk `error.cause` and return the first FineractHttpError, if any. */
export function findFineractHttpError(error: unknown): FineractHttpError | undefined {
  let current: unknown = error;
  let depth = 0;
  while (current != null && depth < MAX_CAUSE_DEPTH) {
    if (current instanceof FineractHttpError) {
      return current;
    }
    if (current instanceof Error && 'cause' in current && current.cause != null) {
      current = current.cause;
      depth += 1;
      continue;
    }
    break;
  }
  return undefined;
}

function readCauseChain(error: unknown): string[] {
  const messages: string[] = [];
  let current: unknown = error instanceof Error ? error.cause : undefined;
  let depth = 0;
  while (current != null && depth < MAX_CAUSE_DEPTH) {
    if (current instanceof FineractHttpError) {
      messages.push(`FineractHttpError: ${current.message}`);
    } else if (current instanceof Error) {
      messages.push(`${current.name}: ${current.message}`);
    } else if (typeof current === 'string') {
      messages.push(current);
    }
    if (current instanceof Error && current.cause != null) {
      current = current.cause;
      depth += 1;
    } else {
      break;
    }
  }
  return messages;
}

function summarizeFineractFieldErrors(error: FineractHttpError): string | undefined {
  const items = error.body?.errors;
  if (!items?.length) {
    return undefined;
  }
  return items
    .slice(0, MAX_FINERACT_FIELD_ERRORS)
    .map((item) => {
      const field = item.parameterName ?? 'field';
      const message = item.defaultUserMessage ?? item.developerMessage ?? 'validation error';
      return `${field}: ${message}`;
    })
    .join('; ');
}

export function readFineractLogFields(error: FineractHttpError): Record<string, unknown> {
  const fieldErrors = summarizeFineractFieldErrors(error);
  return {
    fineractStatus: error.status,
    fineractMethod: error.request?.method,
    fineractPath: error.request?.path,
    fineractSearchParams: error.request?.searchParams,
    fineractUserMessage: error.body?.defaultUserMessage,
    fineractDeveloperMessage: error.body?.developerMessage,
    fineractGlobalisationCode: error.body?.userMessageGlobalisationCode,
    ...(fieldErrors ? { fineractFieldErrors: fieldErrors } : {})
  };
}

export type ErrorLogRecord = Record<string, unknown>;

/**
 * Flat JSON-friendly record for structured logs (Vercel Runtime Logs, grep by `tag`).
 */
export function buildErrorLogRecord(
  error: unknown,
  fields: Record<string, unknown> = {}
): ErrorLogRecord {
  const fineract = findFineractHttpError(error);
  const digest = readErrorDigest(error);
  const name = error instanceof Error ? error.name : undefined;
  const message =
    fineract?.message ??
    (error instanceof Error ? error.message || error.name : undefined) ??
    (typeof error === 'string' ? error : 'Unknown error');

  const record: ErrorLogRecord = {
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    digest,
    name,
    message,
    ...fields
  };

  if (fineract) {
    Object.assign(record, readFineractLogFields(fineract));
  }

  const causes = readCauseChain(error);
  if (causes.length > 0) {
    record.causeChain = causes;
  }

  return record;
}

export function readErrorStack(error: unknown): string | undefined {
  const fineract = findFineractHttpError(error);
  if (fineract?.stack) {
    return fineract.stack;
  }
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Emit one JSON line plus stack trace when available.
 */
export function emitStructuredErrorLog(tag: string, error: unknown, fields: Record<string, unknown> = {}): void {
  const payload = buildErrorLogRecord(error, { tag, ...fields });
  console.error(JSON.stringify(payload));
  const stack = readErrorStack(error);
  if (stack) {
    console.error(stack);
  }
}

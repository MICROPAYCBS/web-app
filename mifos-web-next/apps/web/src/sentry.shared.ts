/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { buildErrorLogRecord, findFineractHttpError } from '@/lib/errors/serialize-error-for-log';

export function resolveSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

/** Vercel target at build/runtime — `local` when not on Vercel. */
export function resolveDeployEnv(): string {
  return process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_DEPLOY_ENV ?? 'local';
}

/** Sentry runs only on Vercel Production (not preview, local dev, or CI builds). */
export function isSentryEnabled(): boolean {
  if (process.env.SENTRY_ENABLED === 'false') {
    return false;
  }
  if (!resolveSentryDsn()) {
    return false;
  }
  return resolveDeployEnv() === 'production';
}

function resolveTracesSampleRate(): number {
  const configured = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (configured != null && configured !== '') {
    const parsed = Number(configured);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return 0.1;
}

/** Drop expected Fineract 4xx API responses — not product defects. */
function shouldDropSentryEvent(error: unknown): boolean {
  const fineract = findFineractHttpError(error);
  return Boolean(fineract && fineract.status > 0 && fineract.status < 500);
}

export function enrichSentryEvent(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const error = hint.originalException;
  if (shouldDropSentryEvent(error)) {
    return null;
  }

  const record = buildErrorLogRecord(error);
  event.extra = { ...event.extra, app: record };

  event.tags = {
    ...event.tags,
    ...(record.digest ? { digest: String(record.digest) } : {}),
    ...(record.fineractPath ? { fineractPath: String(record.fineractPath) } : {}),
    ...(record.fineractStatus != null ? { fineractStatus: String(record.fineractStatus) } : {})
  };

  return event;
}

export function sharedSentryInitOptions() {
  return {
    dsn: resolveSentryDsn(),
    enabled: isSentryEnabled(),
    environment: resolveDeployEnv(),
    tracesSampleRate: resolveTracesSampleRate(),
    beforeSend: enrichSentryEvent
  };
}

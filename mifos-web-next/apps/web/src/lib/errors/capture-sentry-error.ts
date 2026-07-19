/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as Sentry from '@sentry/nextjs';
import { buildErrorLogRecord, findFineractHttpError } from '@/lib/errors/serialize-error-for-log';
import { isSentryEnabled } from '@/sentry.shared';

function shouldReportToSentry(error: unknown): boolean {
  const fineract = findFineractHttpError(error);
  if (fineract && fineract.status > 0 && fineract.status < 500) {
    return false;
  }
  return true;
}

/**
 * Report an error to Sentry with Fineract + digest context.
 * Use for swallowed server loads and client error boundaries (not covered by `captureRequestError`).
 */
export function captureAppError(
  error: unknown,
  fields: Record<string, unknown> = {}
): string | undefined {
  if (!isSentryEnabled() || !shouldReportToSentry(error)) {
    return undefined;
  }

  const record = buildErrorLogRecord(error, fields);
  const exception =
    error instanceof Error ? error : new Error(typeof record.message === 'string' ? record.message : 'Unknown error');

  return Sentry.captureException(exception, {
    extra: { app: record },
    tags: {
      ...(fields.tag ? { appTag: String(fields.tag) } : {}),
      ...(record.digest ? { digest: String(record.digest) } : {}),
      ...(record.fineractPath ? { fineractPath: String(record.fineractPath) } : {}),
      ...(record.fineractStatus != null ? { fineractStatus: String(record.fineractStatus) } : {}),
      ...(fields.surface ? { surface: String(fields.surface) } : {})
    }
  });
}

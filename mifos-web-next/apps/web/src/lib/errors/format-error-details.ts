/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';

export interface FormatErrorDetailsOptions {
  digest?: string;
  componentStack?: string;
}

/** Short, user-facing error summary. */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof FineractHttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || error.name || 'Something went wrong.';
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Something went wrong.';
  }
}

/** Full diagnostic text suitable for support tickets and clipboard copy. */
export function formatErrorDetails(
  error: unknown,
  options: FormatErrorDetailsOptions = {}
): string {
  const lines: string[] = [];
  lines.push(`Message: ${formatErrorMessage(error)}`);

  if (error instanceof Error && error.name) {
    lines.push(`Name: ${error.name}`);
  }

  if (error instanceof FineractHttpError) {
    lines.push(`Status: ${error.status}`);
    if (error.body) {
      try {
        lines.push(`Body: ${JSON.stringify(error.body, null, 2)}`);
      } catch {
        lines.push('Body: [unserializable]');
      }
    }
  }

  if (options.digest) {
    lines.push(`Digest: ${options.digest}`);
  }

  if (error instanceof Error && error.stack) {
    lines.push('', 'Stack:', error.stack);
  }

  if (options.componentStack?.trim()) {
    lines.push('', 'Component stack:', options.componentStack.trim());
  }

  return lines.join('\n');
}

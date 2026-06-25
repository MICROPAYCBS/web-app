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

/** Default title for opaque production failures (RSC, unexpected throws). */
export const PRODUCTION_ERROR_TITLE = "We couldn't load this page";

/** Default body copy when the real error is hidden in production. */
export const PRODUCTION_ERROR_DESCRIPTION =
  'A technical issue occurred. Our team has been notified. Please try again or return to the dashboard.';

const OPAQUE_SERVER_ERROR_SNIPPET = 'An error occurred in the Server Components render';

export function isProductionBuild(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Next.js replaces server render errors in production — message is not safe to show users. */
export function isOpaqueServerError(error: unknown, digest?: string): boolean {
  if (!digest) {
    return false;
  }
  if (!(error instanceof Error)) {
    return true;
  }
  return (
    error.message.includes(OPAQUE_SERVER_ERROR_SNIPPET) ||
    error.message.includes('omitted in production builds')
  );
}

/** Short, user-facing error summary. */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof FineractHttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message === 'fetch failed') {
      return 'Could not reach the server. Check that it is running and your network connection.';
    }
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'The server did not respond in time.';
    }
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

export type ErrorPanelPresentation = {
  title: string;
  description: string;
  /** Extra line under the description — omitted in production when redundant. */
  summary: string | null;
  showTechnicalDetails: boolean;
  supportDetails: string;
  referenceId: string | null;
};

function productionDescription(error: unknown, digest?: string): string {
  if (isOpaqueServerError(error, digest)) {
    return PRODUCTION_ERROR_DESCRIPTION;
  }
  if (error instanceof FineractHttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message === 'fetch failed') {
      return 'We could not reach the server. Check your connection and try again.';
    }
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'The server did not respond in time. Please try again.';
    }
  }
  return PRODUCTION_ERROR_DESCRIPTION;
}

function productionTitle(error: unknown, digest?: string): string {
  if (isOpaqueServerError(error, digest)) {
    return PRODUCTION_ERROR_TITLE;
  }
  if (error instanceof Error) {
    if (error.message === 'fetch failed') {
      return 'Connection problem';
    }
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'Request timed out';
    }
  }
  return PRODUCTION_ERROR_TITLE;
}

/** User-facing copy and whether to show the developer detail block. */
export function getErrorPanelPresentation(
  error: unknown,
  options: FormatErrorDetailsOptions & {
    title?: string;
    description?: string;
  } = {}
): ErrorPanelPresentation {
  const supportDetails = formatErrorDetails(error, options);
  const referenceId = options.digest?.trim() || null;

  if (!isProductionBuild()) {
    return {
      title: options.title ?? 'Something went wrong',
      description:
        options.description ??
        'An unexpected error occurred. You can copy the details below when contacting support.',
      summary: formatErrorMessage(error),
      showTechnicalDetails: true,
      supportDetails,
      referenceId
    };
  }

  return {
    title: options.title ?? productionTitle(error, options.digest),
    description: options.description ?? productionDescription(error, options.digest),
    summary: null,
    showTechnicalDetails: false,
    supportDetails,
    referenceId
  };
}

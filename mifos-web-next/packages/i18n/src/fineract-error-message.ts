/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { translateFineractCode } from './error-messages';

/** Subset of a Fineract API error payload used for user-facing messages. */
export interface FineractErrorItem {
  parameterName?: string;
  defaultUserMessage?: string;
  developerMessage?: string;
  userMessageGlobalisationCode?: string;
}

export interface FineractErrorBody {
  defaultUserMessage?: string;
  developerMessage?: string;
  userMessageGlobalisationCode?: string;
  errors?: FineractErrorItem[];
}

const DATABASE_INTEGRITY_CODES = new Set([
  'error.msg.data.integrity.issue.entity.duplicated',
  'error.msg.data.integrity.issue'
]);

/** Fineract sometimes escapes dots in messages (e.g. `Activation.date`). */
export function normalizeFineractMessage(message: string): string {
  return message.replace(/\\\./g, '.').trim();
}

/**
 * Resolve the best human-readable message for one Fineract error entry.
 * Prefers `defaultUserMessage`, then `developerMessage`, then a known translation for the code.
 */
export function resolveFineractErrorItemMessage(item?: FineractErrorItem | null): string | null {
  if (!item) {
    return null;
  }

  const raw = item.defaultUserMessage ?? item.developerMessage;
  if (raw) {
    return normalizeFineractMessage(raw);
  }

  const code = item.userMessageGlobalisationCode;
  if (code) {
    return translateFineractCode(code);
  }

  return null;
}

function resolvePrimaryNestedMessage(errors: FineractErrorItem[]): string | null {
  const first = errors[0];
  if (!first) {
    return null;
  }

  const code = first.userMessageGlobalisationCode;
  if (code && DATABASE_INTEGRITY_CODES.has(code)) {
    const specific = first.defaultUserMessage ?? first.developerMessage;
    if (specific) {
      return normalizeFineractMessage(specific);
    }
    return translateFineractCode(code);
  }

  return resolveFineractErrorItemMessage(first);
}

function collectNestedErrorMessages(errors: FineractErrorItem[]): string[] {
  return [...new Set(
    errors
      .map((item) => resolveFineractErrorItemMessage(item))
      .filter((message): message is string => Boolean(message))
  )];
}

/**
 * Extract the user-facing message Fineract intended, aligned with legacy web-app behavior.
 */
export function getFineractErrorMessage(
  body: FineractErrorBody | null | undefined,
  httpStatus?: number
): string {
  if (!body) {
    return httpStatus ? `HTTP ${httpStatus}` : 'Request failed';
  }

  const topLevel = resolveFineractErrorItemMessage({
    defaultUserMessage: body.defaultUserMessage,
    developerMessage: body.developerMessage,
    userMessageGlobalisationCode: body.userMessageGlobalisationCode
  });

  if (body.errors?.length) {
    const nestedMessages = collectNestedErrorMessages(body.errors);
    if (nestedMessages.length > 1) {
      return nestedMessages.join('\n');
    }
    if (nestedMessages.length === 1) {
      return nestedMessages[0];
    }

    const nestedPrimary = resolvePrimaryNestedMessage(body.errors);
    if (nestedPrimary) {
      return nestedPrimary;
    }
  }

  if (topLevel) {
    return topLevel;
  }

  return httpStatus ? `HTTP ${httpStatus}` : 'Request failed';
}

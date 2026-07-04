/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';

export const LEGAL_TENDER_UNAVAILABLE_TITLE = 'Legal tenders unavailable';

export const LEGAL_TENDER_UNAVAILABLE_MESSAGE =
  'Legal tender denominations could not be loaded. Denomination tracking may not be enabled on your server yet, or this currency may not be configured.';

export const LEGAL_TENDER_UNAVAILABLE_HINT =
  'Ask your administrator to enable denomination tracking and configure note and coin values for this currency.';

export function isLegalTenderNotFoundError(error: unknown): boolean {
  return error instanceof FineractHttpError && error.status === 404;
}

export function legalTenderLoadFailure(
  message: string,
  status?: number
): { message: string; hint?: string; status?: number } {
  if (status === 404) {
    return {
      message: LEGAL_TENDER_UNAVAILABLE_MESSAGE,
      hint: LEGAL_TENDER_UNAVAILABLE_HINT,
      status
    };
  }
  return { message, status };
}

export function legalTenderLoadFailureFromError(
  error: unknown,
  fallback: string
): { message: string; hint?: string; status?: number } {
  if (error instanceof FineractHttpError) {
    return legalTenderLoadFailure(error.message, error.status);
  }
  return {
    message: error instanceof Error && error.message ? error.message : fallback
  };
}

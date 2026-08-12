/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractApiError {
  httpStatusCode?: number;
  defaultUserMessage?: string;
  developerMessage?: string;
  userMessageGlobalisationCode?: string;
  errors?: Array<{
    parameterName?: string;
    defaultUserMessage?: string;
    developerMessage?: string;
    userMessageGlobalisationCode?: string;
  }>;
}

/** Identifies which Fineract REST call failed (for logs and support). */
export interface FineractRequestInfo {
  method: string;
  path: string;
  searchParams?: Record<string, string>;
}

export interface FineractClientConfig {
  baseUrl: string;
  tenantId: string;
  /** Basic auth or bearer token — set by session layer in apps/web */
  getAuthHeader: () => Promise<string | null>;
  /** Optional fetch override (e.g. dev self-signed TLS in apps/web). */
  fetch?: typeof fetch;
  /**
   * Called after a non-OK response with HTTP 401, before the error is thrown.
   * Use this for central session-ended handling. Do not wrap `fetch` in a catch
   * that swallows Next.js `redirect()` (`NEXT_REDIRECT`).
   */
  onUnauthorized?: (error: {
    status: number;
    platformReason?: string | null;
  }) => void | Promise<void>;
}

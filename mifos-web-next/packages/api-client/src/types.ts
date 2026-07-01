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
    userMessageGlobalisationCode?: string;
  }>;
}

export interface FineractClientConfig {
  baseUrl: string;
  tenantId: string;
  /** Basic auth or bearer token — set by session layer in apps/web */
  getAuthHeader: () => Promise<string | null>;
}

/** Report parameter from GET /reports/{id}?fields=reportParameters */
export interface FineractReportParameter {
  id?: number;
  parameterId?: number;
  parameterName?: string;
  reportParameterName?: string;
  parameterLabel?: string;
  displayLabel?: string;
}

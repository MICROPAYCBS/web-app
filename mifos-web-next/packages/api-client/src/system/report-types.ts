/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractReportAllowedParameter {
  id: number;
  parameterName: string;
}

export interface FineractReportParameter {
  id?: number | string;
  parameterId: number;
  parameterName?: string;
  reportParameterName?: string;
}

export interface FineractReportListItem {
  id: number;
  reportName: string;
  reportType: string;
  reportSubType?: string;
  reportCategory?: string;
  coreReport: boolean;
  useReport: boolean;
}

export interface FineractReportTemplate {
  allowedReportTypes: string[];
  allowedReportSubTypes: string[];
  allowedParameters: FineractReportAllowedParameter[];
}

export interface FineractReportDetail extends FineractReportListItem {
  description?: string;
  reportSql?: string;
  reportParameters?: FineractReportParameter[];
  allowedReportTypes: string[];
  allowedReportSubTypes: string[];
  allowedParameters: FineractReportAllowedParameter[];
}

export interface FineractReportMutationResponse {
  resourceId: number;
}

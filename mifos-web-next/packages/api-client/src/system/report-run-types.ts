/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractReportRunColumnHeader {
  columnName: string;
  columnType: string;
  isColumnNullable?: boolean;
  isColumnPrimaryKey?: boolean;
  columnValues?: unknown[];
}

export interface FineractReportRunResult {
  columnHeaders: FineractReportRunColumnHeader[];
  data: Array<{ row: unknown[] } | Record<string, unknown>>;
}

export interface FineractReportRunParameterMetadata {
  parameterName: string;
  parameterLabel?: string;
  parameterVariable?: string;
  parameterDisplayType?: string;
  parameterFormatType?: string;
  parameterType?: string;
  defaultVal?: string;
  selectOne?: boolean;
  selectAll?: boolean;
  parentParameterName?: string;
}

export interface FineractReportRunParameterOption {
  id: string | number;
  name: string;
}

export type FineractReportRunParameter = FineractReportRunParameterMetadata & {
  id?: number | string;
  reportParameterName?: string;
};

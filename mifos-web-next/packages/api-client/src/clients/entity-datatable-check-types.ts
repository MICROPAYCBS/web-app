/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractEntityDatatableCheckStatus {
  id?: number;
  code?: string;
  value?: string;
}

export interface FineractEntityDatatableCheck {
  id: number;
  entity: string;
  status: FineractEntityDatatableCheckStatus;
  datatableName: string;
  productId?: number;
  productName?: string;
  systemDefined?: boolean;
  order?: number;
}

export interface FineractEntityDatatableChecksPage {
  totalFilteredRecords: number;
  pageItems: FineractEntityDatatableCheck[];
}

export interface FineractEntityDatatableCheckStatusOption {
  name: string;
  code: number;
}

export interface FineractEntityDatatableCheckDatatableOption {
  entity: string;
  dataTableName: string;
}

export interface FineractEntityDatatableCheckProductOption {
  id: number;
  name: string;
}

export interface FineractEntityDatatableCheckTemplate {
  entities?: string[];
  statusClient?: FineractEntityDatatableCheckStatusOption[];
  statusGroup?: FineractEntityDatatableCheckStatusOption[];
  statusSavings?: FineractEntityDatatableCheckStatusOption[];
  statusLoans?: FineractEntityDatatableCheckStatusOption[];
  datatables?: FineractEntityDatatableCheckDatatableOption[];
  loanProductDatas?: FineractEntityDatatableCheckProductOption[];
  savingsProductDatas?: FineractEntityDatatableCheckProductOption[];
}

export interface FineractCreateEntityDatatableCheckPayload {
  entity: string;
  status: number;
  datatableName: string;
  productId?: number;
}

export interface FineractCreateResourceResponse {
  resourceId?: number;
}

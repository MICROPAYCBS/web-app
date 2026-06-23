/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractAuditTrailUserOption {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
}

export interface FineractAuditTrailProcessingResultOption {
  id: number;
  processingResult: string;
}

export interface FineractAuditTrailListItem {
  id: number;
  resourceId?: number;
  subresourceId?: number;
  processingResult?: string;
  maker?: string;
  actionName?: string;
  entityName?: string;
  officeName?: string;
  madeOnDate?: string | number[] | number;
  checker?: string;
  checkedOnDate?: string | number[] | number;
  ip?: string;
  clientName?: string;
}

export interface FineractAuditTrailDetail extends FineractAuditTrailListItem {
  commandAsJson?: string;
  savingsAccountNo?: string;
  groupLevelName?: string;
  groupName?: string;
  url?: string;
}

export interface FineractAuditTrailsPage {
  totalFilteredRecords: number;
  pageItems: FineractAuditTrailListItem[];
}

export interface FineractAuditTrailSearchTemplate {
  appUsers: FineractAuditTrailUserOption[];
  actionNames: string[];
  entityNames: string[];
  processingResults: FineractAuditTrailProcessingResultOption[];
  dateFormat?: string;
  locale?: string;
}

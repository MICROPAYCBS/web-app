/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface BulkLoanReassignmentLoanOfficerOption {
  id: number;
  displayName: string;
}

export interface BulkLoanReassignmentOfficeTemplate {
  officeId: number;
  loanOfficerOptions: BulkLoanReassignmentLoanOfficerOption[];
}

export interface BulkLoanReassignmentLoanSummary {
  id: number;
  productName?: string;
  accountNo?: string;
}

export interface BulkLoanReassignmentAccountOwner {
  displayName: string;
  loans: BulkLoanReassignmentLoanSummary[];
}

export interface BulkLoanReassignmentAccountSummaryCollection {
  clients: BulkLoanReassignmentAccountOwner[];
  groups: BulkLoanReassignmentAccountOwner[];
}

export interface BulkLoanReassignmentOfficerTemplate {
  accountSummaryCollection: BulkLoanReassignmentAccountSummaryCollection;
}

export interface BulkLoanReassignmentMutationResponse {
  resourceId?: number;
  changes?: Record<string, unknown>;
}

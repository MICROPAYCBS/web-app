/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractGlClosureListItem {
  id: number;
  officeId: number;
  officeName: string;
  closingDate: string;
  comments: string;
  createdByUsername: string;
}

export interface FineractGlClosureDetail {
  id: number;
  officeId: number;
  officeName: string;
  closingDate: string;
  comments: string;
  createdByUsername: string;
  createdDate: string;
  lastUpdatedByUsername: string;
  lastUpdatedDate: string;
}

export interface FineractGlClosureMutationResponse {
  resourceId: number;
}

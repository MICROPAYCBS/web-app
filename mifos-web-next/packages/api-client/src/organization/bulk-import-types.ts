/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface BulkImportHistoryItem {
  importId: number;
  name: string;
  importTime?: number[] | string;
  endTime?: number[] | string;
  completed?: boolean | string;
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
}

export interface BulkImportStaffOption {
  id: number;
  displayName: string;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface CheckerInboxListItem {
  id: number;
  resourceId?: number;
  processingResult?: string;
  maker?: string;
  actionName?: string;
  entityName?: string;
  officeName?: string;
  madeOnDate?: string | number[];
}

export interface CheckerInboxSearchTemplate {
  actionNames: string[];
  entityNames: string[];
}

export type CheckerInboxActionCommand = 'approve' | 'reject';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FineractSearchEntityStatus {
  id?: number;
  code?: string;
  value?: string;
}

export interface FineractSearchResult {
  entityId: number;
  entityAccountNo?: string;
  entityExternalId?: string;
  entityName?: string;
  entityType: string;
  parentId?: number;
  parentName?: string;
  entityStatus?: FineractSearchEntityStatus;
  parentType?: string;
  subEntityType?: string;
  /** Populated server-side for client hits — not returned by GET /search. */
  entityMobileNo?: string;
  entityEmail?: string;
}

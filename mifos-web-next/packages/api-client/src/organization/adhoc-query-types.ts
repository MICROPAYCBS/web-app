/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface AdhocQueryListItem {
  id: number;
  name: string;
  query?: string;
  tableName?: string;
  email?: string;
  reportRunFrequency?: number | string;
  reportRunFrequencyLabel?: string;
  reportRunFrequencies?: FineractEnumOption[];
  isActive?: boolean;
  createdBy?: string;
}

export interface AdhocQueryDetail extends AdhocQueryListItem {
  tableFields?: string;
  reportRunEvery?: number;
}

export interface AdhocQueryTemplate {
  reportRunFrequencies: FineractEnumOption[];
}

export interface AdhocQueryEditTemplate extends AdhocQueryDetail {
  reportRunFrequencies: FineractEnumOption[];
}

export interface AdhocQueryMutationResponse {
  resourceId?: number;
}

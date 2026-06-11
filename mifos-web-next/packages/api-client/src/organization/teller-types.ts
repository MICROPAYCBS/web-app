/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface OrganizationTeller {
  id: number;
  officeId: number;
  officeName?: string;
  name: string;
  description?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  status?: string;
}

export interface OrganizationTellerListItem {
  id: number;
  officeId?: number;
  officeName?: string;
  name: string;
  startDate?: number[] | string;
  status?: string;
}

export interface OrganizationCashierListItem {
  id: number;
  staffId?: number;
  staffName?: string;
  tellerId?: number;
  tellerName?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  isFullDay?: boolean;
}

export interface OrganizationTellerMutationResponse {
  resourceId?: number;
}

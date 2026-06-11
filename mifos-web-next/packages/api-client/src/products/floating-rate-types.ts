/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface FloatingRatePeriod {
  id?: number;
  fromDate?: number[] | string;
  interestRate?: number;
  isDifferentialToBaseLendingRate?: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdOn?: number[] | string;
  modifiedBy?: string;
  modifiedOn?: number[] | string;
}

export interface FloatingRateListItem {
  id: number;
  name?: string;
  createdBy?: string;
  isBaseLendingRate?: boolean;
  isActive?: boolean;
}

export interface FloatingRateDetail {
  id: number;
  name?: string;
  createdBy?: string;
  isBaseLendingRate?: boolean;
  isActive?: boolean;
  ratePeriods?: FloatingRatePeriod[];
}

export interface FloatingRateMutationResponse {
  resourceId: number;
}

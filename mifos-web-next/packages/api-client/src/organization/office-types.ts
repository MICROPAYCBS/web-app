/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '../clients/types';

export interface OfficeBranchProfile {
  officeCode?: string;
  branchType?: string;
  regionCode?: string;
  address?: string;
  city?: string;
  countryCode?: string;
  phoneNo?: string;
  emailAddress?: string;
  managerStaffId?: number;
  managerStaffName?: string;
  swiftCode?: string;
  latitude?: string;
  longitude?: string;
  cashLimit?: number;
  workingHours?: string;
  status?: string;
}

export interface FineractOfficeListItem {
  id: number;
  name: string;
  nameDecorated?: string;
  externalId?: string;
  openingDate?: number[] | string;
  parentName?: string;
  parentId?: number;
  hierarchy?: string;
  branchProfile?: OfficeBranchProfile;
}

export interface FineractOfficeDetail extends FineractOfficeListItem {}

export interface FineractOfficeEditTemplate extends FineractOfficeDetail {
  allowedParents?: FineractOfficeOption[];
}

export interface FineractCreateOfficeResponse {
  resourceId?: number;
  officeId?: number;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export interface HolidayStatus {
  id?: number;
  code?: string;
  value?: string;
}

export interface HolidayOfficeRef {
  officeId: number;
  officeName?: string;
}

export interface HolidayListItem {
  id: number;
  name: string;
  fromDate?: string | number[];
  toDate?: string | number[];
  repaymentsRescheduledTo?: string | number[] | null;
  reschedulingType?: number;
  description?: string;
  status?: HolidayStatus;
}

export interface HolidayDetail extends HolidayListItem {
  offices?: HolidayOfficeRef[];
}

export type HolidayReschedulingTypeOption = FineractEnumOption;

export interface HolidayMutationResponse {
  resourceId?: number;
}

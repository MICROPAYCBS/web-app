/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const BUSINESS_DATE_TYPE = 'BUSINESS_DATE' as const;
export const COB_DATE_TYPE = 'COB_DATE' as const;

export type FineractBusinessDateType = typeof BUSINESS_DATE_TYPE | typeof COB_DATE_TYPE;

export interface FineractBusinessDateEntry {
  type: FineractBusinessDateType;
  date: string | number[];
}

export interface FineractBusinessDateUpdatePayload {
  type: FineractBusinessDateType;
  date: string;
  dateFormat: string;
  locale: string;
}

export interface FineractBusinessDateUpdateResponse {
  changes?: {
    type?: string;
    date?: string;
  };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '../clients/types';

export type DelinquencyBucketApiType = 'REGULAR' | 'WORKING_CAPITAL';
export type DelinquencyBucketQueryType = 'regular' | 'workingcapital';

export interface DelinquencyStringEnumOption {
  id: string;
  code?: string;
  value?: string;
}

export interface DelinquencyRangeListItem {
  id: number;
  classification?: string;
  minimumAgeDays?: number;
  maximumAgeDays?: number;
}

export type DelinquencyRangeDetail = DelinquencyRangeListItem;

export interface DelinquencyMinimumPaymentRule {
  frequency?: number;
  frequencyType?: FineractEnumOption | DelinquencyStringEnumOption;
  minimumPayment?: number;
  minimumPaymentType?: FineractEnumOption | DelinquencyStringEnumOption;
}

export interface DelinquencyBucketRangeRef {
  id: number;
  classification?: string;
  minimumAgeDays?: number;
  maximumAgeDays?: number;
}

export interface DelinquencyBucketTypeOption {
  id?: DelinquencyBucketApiType | number | string;
  code?: string;
  value?: string;
}

export interface DelinquencyBucketListItem {
  id: number;
  name?: string;
  bucketType?: DelinquencyBucketTypeOption;
}

export interface DelinquencyBucketDetail {
  id: number;
  name?: string;
  bucketType?: DelinquencyBucketTypeOption;
  ranges?: DelinquencyBucketRangeRef[];
  minimumPaymentPeriodAndRule?: DelinquencyMinimumPaymentRule;
}

export interface DelinquencyBucketTemplate {
  ranges?: DelinquencyRangeListItem[];
  rangesOptions?: DelinquencyRangeListItem[];
  frequencyTypeOptions?: DelinquencyStringEnumOption[];
  minimumPaymentOptions?: DelinquencyStringEnumOption[];
}

export interface DelinquencyMutationResponse {
  resourceId: number;
}

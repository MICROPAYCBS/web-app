/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyBucketQueryType } from '@mifos/api-client';

export const DELINQUENCY_CONFIGURATIONS_PATH = '/products/delinquency-bucket-configurations';
export const DELINQUENCY_RANGES_PATH = `${DELINQUENCY_CONFIGURATIONS_PATH}/ranges`;
export const DELINQUENCY_BUCKETS_PATH = `${DELINQUENCY_CONFIGURATIONS_PATH}/buckets`;

export function delinquencyConfigurationsPath(): string {
  return DELINQUENCY_CONFIGURATIONS_PATH;
}

export function delinquencyRangesListPath(): string {
  return DELINQUENCY_RANGES_PATH;
}

export function delinquencyRangeDetailPath(rangeId: string | number): string {
  return `${DELINQUENCY_RANGES_PATH}/${rangeId}`;
}

export function delinquencyRangeCreatePath(): string {
  return `${DELINQUENCY_RANGES_PATH}?create=1`;
}

export function delinquencyRangeEditPath(rangeId: string | number): string {
  return `${delinquencyRangeDetailPath(rangeId)}?edit=1`;
}

export function delinquencyBucketsListPath(): string {
  return DELINQUENCY_BUCKETS_PATH;
}

export function delinquencyBucketDetailPath(
  bucketId: string | number,
  bucketType?: DelinquencyBucketQueryType
): string {
  const base = `${DELINQUENCY_BUCKETS_PATH}/${bucketId}`;
  return bucketType ? `${base}?bucketType=${bucketType}` : base;
}

export function delinquencyBucketCreatePath(bucketType: DelinquencyBucketQueryType): string {
  return `${DELINQUENCY_BUCKETS_PATH}/create?bucketType=${bucketType}`;
}

export function delinquencyBucketEditPath(
  bucketId: string | number,
  bucketType: DelinquencyBucketQueryType
): string {
  return `${DELINQUENCY_BUCKETS_PATH}/${bucketId}/edit?bucketType=${bucketType}`;
}

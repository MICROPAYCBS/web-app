/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import {
  DelinquencyBucketFormPage,
  delinquencyBucketRangeIdsFromDetail
} from '@/components/products/delinquency/delinquency-bucket-form-page';
import {
  getDelinquencyBucket,
  getDelinquencyBucketFormOptions
} from '@/lib/fineract/delinquency-buckets';
import {
  bucketTypeToQueryParam,
  parseDelinquencyBucketQueryType
} from '@/lib/fineract/delinquency-display';
import { getServerSession } from '@/lib/session/server';

export default async function DelinquencyBucketEditPage({
  params,
  searchParams
}: {
  params: Promise<{ bucketId: string }>;
  searchParams: Promise<{ bucketType?: string }>;
}) {
  const { bucketId } = await params;
  const { bucketType: bucketTypeParam } = await searchParams;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.delinquency.buckets.update'))) {
    notFound();
  }

  let bucket;
  try {
    bucket = await getDelinquencyBucket(bucketId);
  } catch {
    notFound();
  }

  const bucketType =
    bucketTypeParam !== undefined
      ? parseDelinquencyBucketQueryType(bucketTypeParam)
      : bucketTypeToQueryParam(bucket.bucketType);

  const options = await getDelinquencyBucketFormOptions(bucketType);
  const paymentRule = bucket.minimumPaymentPeriodAndRule;

  return (
    <DelinquencyBucketFormPage
      mode="edit"
      bucketType={bucketType}
      bucketId={bucket.id}
      initialName={bucket.name}
      initialRangeIds={delinquencyBucketRangeIdsFromDetail(bucket.ranges)}
      initialFrequency={paymentRule?.frequency}
      initialFrequencyType={
        paymentRule?.frequencyType?.id !== undefined
          ? String(paymentRule.frequencyType.id)
          : undefined
      }
      initialMinimumPayment={paymentRule?.minimumPayment}
      initialMinimumPaymentType={
        paymentRule?.minimumPaymentType?.id !== undefined
          ? String(paymentRule.minimumPaymentType.id)
          : undefined
      }
      rangeOptions={options.rangeOptions ?? []}
      frequencyTypeOptions={options.frequencyTypeOptions}
      minimumPaymentOptions={options.minimumPaymentOptions}
    />
  );
}

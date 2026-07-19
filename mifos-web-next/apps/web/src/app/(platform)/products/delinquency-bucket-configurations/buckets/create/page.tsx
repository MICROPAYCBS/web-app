/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DelinquencyBucketFormPage } from '@/components/products/delinquency/delinquency-bucket-form-page';
import { getDelinquencyBucketFormOptions } from '@/lib/fineract/delinquency-buckets';
import { parseDelinquencyBucketQueryType } from '@/lib/fineract/delinquency-display';
import { getServerSession } from '@/lib/session/server';

export default async function DelinquencyBucketCreatePage({
  searchParams
}: {
  searchParams: Promise<{ bucketType?: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.delinquency.buckets.create'))) {
    notFound();
  }

  const { bucketType: bucketTypeParam } = await searchParams;
  const bucketType = parseDelinquencyBucketQueryType(bucketTypeParam);
  const options = await getDelinquencyBucketFormOptions(bucketType);

  return (
    <DelinquencyBucketFormPage
      mode="create"
      bucketType={bucketType}
      rangeOptions={options.rangeOptions ?? []}
      frequencyTypeOptions={options.frequencyTypeOptions}
      minimumPaymentOptions={options.minimumPaymentOptions}
    />
  );
}

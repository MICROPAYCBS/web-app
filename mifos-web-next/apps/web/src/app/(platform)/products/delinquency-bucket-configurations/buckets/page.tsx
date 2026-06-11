/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DelinquencyBucketsPageContent } from '@/components/products/delinquency/delinquency-buckets-page-content';
import { listDelinquencyBuckets } from '@/lib/fineract/delinquency-buckets';
import { getServerSession } from '@/lib/session/server';

export default async function DelinquencyBucketsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.delinquency.buckets'))) {
    notFound();
  }

  const buckets = await listDelinquencyBuckets();
  return <DelinquencyBucketsPageContent buckets={buckets} />;
}

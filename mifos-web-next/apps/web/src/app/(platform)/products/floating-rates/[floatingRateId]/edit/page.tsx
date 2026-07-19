/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FloatingRateFormPage } from '@/components/products/floating-rate/floating-rate-form-page';
import { floatingRatePeriodsFromDetail } from '@/lib/fineract/floating-rate-display';
import { getFloatingRate } from '@/lib/fineract/floating-rates';
import { getServerSession } from '@/lib/session/server';

export default async function FloatingRateEditPage({
  params
}: {
  params: Promise<{ floatingRateId: string }>;
}) {
  const { floatingRateId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.floatingRates.update'))) {
    notFound();
  }

  let rate;
  try {
    rate = await getFloatingRate(floatingRateId);
  } catch {
    notFound();
  }

  return (
    <FloatingRateFormPage
      mode="edit"
      floatingRateId={rate.id}
      initialName={rate.name}
      initialIsBaseLendingRate={rate.isBaseLendingRate}
      initialIsActive={rate.isActive}
      initialPeriods={floatingRatePeriodsFromDetail(rate.ratePeriods)}
    />
  );
}

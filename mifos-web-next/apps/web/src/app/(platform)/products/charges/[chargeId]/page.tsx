/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ChargeDetailView } from '@/components/products/charges/charge-detail-view';
import { getCharge } from '@/lib/fineract/charges';
import { getServerSession } from '@/lib/session/server';

export default async function ChargeDetailPage({
  params
}: {
  params: Promise<{ chargeId: string }>;
}) {
  const { chargeId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.charges'))) {
    notFound();
  }

  let charge;
  try {
    charge = await getCharge(chargeId);
  } catch {
    notFound();
  }

  return (
    <ChargeDetailView
      charge={charge}
      canEdit={can(session, resolvePermission('products.charges.update'))}
      canDelete={can(session, resolvePermission('products.charges.delete'))}
    />
  );
}

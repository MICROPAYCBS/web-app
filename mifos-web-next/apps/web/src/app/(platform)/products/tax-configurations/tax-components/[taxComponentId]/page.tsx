/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { TaxComponentDetailPageClient } from '@/components/products/tax/tax-component-detail-page-client';
import { getTaxComponent } from '@/lib/fineract/tax-components';
import { getServerSession } from '@/lib/session/server';

export default async function TaxComponentDetailPage({
  params
}: {
  params: Promise<{ taxComponentId: string }>;
}) {
  const { taxComponentId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.tax.components'))) {
    notFound();
  }

  let component;
  try {
    component = await getTaxComponent(taxComponentId);
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <TaxComponentDetailPageClient
        component={component}
        canEdit={can(session, resolvePermission('products.tax.components.update'))}
      />
    </Suspense>
  );
}

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
import { TaxComponentsPageClient } from '@/components/products/tax/tax-components-page-client';
import {
  getTaxComponentTemplate,
  listTaxComponents
} from '@/lib/fineract/tax-components';
import { getServerSession } from '@/lib/session/server';

export default async function TaxComponentsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.tax.components'))) {
    notFound();
  }

  const [components, template] = await Promise.all([
    listTaxComponents(),
    getTaxComponentTemplate()
  ]);

  return (
    <Suspense fallback={null}>
      <TaxComponentsPageClient
        components={components}
        template={template}
        canCreate={can(session, resolvePermission('products.tax.components.create'))}
      />
    </Suspense>
  );
}

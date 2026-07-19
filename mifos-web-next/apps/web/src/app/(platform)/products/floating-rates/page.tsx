/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FloatingRatesPageContent } from '@/components/products/floating-rate/floating-rates-page-content';
import { listFloatingRates } from '@/lib/fineract/floating-rates';
import { getServerSession } from '@/lib/session/server';

export default async function FloatingRatesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.floatingRates'))) {
    notFound();
  }

  const rates = await listFloatingRates();
  return <FloatingRatesPageContent rates={rates} />;
}

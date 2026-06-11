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
import { getServerSession } from '@/lib/session/server';

export default async function FloatingRateCreatePage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.floatingRates.create'))) {
    notFound();
  }

  return <FloatingRateFormPage mode="create" />;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { taxComponentEditPath } from '@/lib/fineract/tax-paths';
import { getServerSession } from '@/lib/session/server';

export default async function TaxComponentEditRedirectPage({
  params
}: {
  params: Promise<{ taxComponentId: string }>;
}): Promise<never> {
  const { taxComponentId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.tax.components.update'))) {
    notFound();
  }

  redirect(taxComponentEditPath(taxComponentId));
}

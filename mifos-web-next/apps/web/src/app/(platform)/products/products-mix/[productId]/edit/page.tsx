/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { productMixEditPath } from '@/lib/fineract/product-mix-paths';
import { getServerSession } from '@/lib/session/server';

export default async function ProductMixEditRedirectPage({
  params
}: {
  params: Promise<{ productId: string }>;
}): Promise<never> {
  const { productId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('products.mix.update'))) {
    notFound();
  }

  redirect(productMixEditPath(productId));
}

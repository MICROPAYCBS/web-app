/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { taxGroupCreatePath } from '@/lib/fineract/tax-paths';
import { getServerSession } from '@/lib/session/server';

/** Legacy create route — creation now uses the sidebar on the tax groups list. */
export default async function TaxGroupCreateRedirectPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.tax.groups.create'))) {
    notFound();
  }

  return redirect(taxGroupCreatePath());
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { TaxGroupFormPage } from '@/components/products/tax/tax-group-form-page';
import { getTaxGroupTemplate } from '@/lib/fineract/tax-groups';
import { getServerSession } from '@/lib/session/server';

export default async function TaxGroupCreatePage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.tax.groups.create'))) {
    notFound();
  }

  const template = await getTaxGroupTemplate();
  return <TaxGroupFormPage mode="create" componentOptions={template.taxComponents} />;
}

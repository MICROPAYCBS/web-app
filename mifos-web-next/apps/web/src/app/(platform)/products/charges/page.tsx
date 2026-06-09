/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ChargesPageContent } from '@/components/products/charges/charges-page-content';
import { getChargeFormTemplate, listCharges } from '@/lib/fineract/charges';
import { getServerSession } from '@/lib/session/server';

export default async function ChargesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.charges'))) {
    notFound();
  }

  const [charges, template] = await Promise.all([listCharges(), getChargeFormTemplate()]);

  return (
    <ChargesPageContent
      charges={charges}
      appliesToOptions={template.chargeAppliesToOptions}
    />
  );
}

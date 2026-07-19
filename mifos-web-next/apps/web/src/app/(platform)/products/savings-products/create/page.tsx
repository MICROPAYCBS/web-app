/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { SavingsProductWizard } from '@/components/products/savings/wizard/savings-product-wizard';
import {
  enrichSavingsProductTemplate,
  savingsProductDraftFromTemplate
} from '@/lib/fineract/savings-product-draft';
import { getSavingsProductTemplate } from '@/lib/fineract/savings-products';
import { getServerSession } from '@/lib/session/server';

export default async function CreateSavingsProductPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.savings.create'));
  } catch {
    redirect('/forbidden');
  }

  const rawTemplate = await getSavingsProductTemplate();
  const template = await enrichSavingsProductTemplate(rawTemplate);
  const initialDraft = savingsProductDraftFromTemplate(template);

  return (
    <SavingsProductWizard mode="create" template={template} initialDraft={initialDraft} />
  );
}

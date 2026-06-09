/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { DepositProductWizard } from '@/components/products/deposit/wizard/deposit-product-wizard';
import { FIXED_DEPOSIT_CONFIG } from '@/lib/fineract/deposit-product-config';
import {
  depositProductDraftFromTemplate,
  enrichDepositProductTemplate
} from '@/lib/fineract/deposit-product-draft';
import { getDepositProductTemplate } from '@/lib/fineract/deposit-products';
import { getServerSession } from '@/lib/session/server';

export default async function CreateFixedDepositProductPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.fixedDeposit.create'));
  } catch {
    redirect('/forbidden');
  }

  const rawTemplate = await getDepositProductTemplate('fixed');
  const template = await enrichDepositProductTemplate(rawTemplate);
  const initialDraft = depositProductDraftFromTemplate('fixed', template);

  return (
    <DepositProductWizard
      kind="fixed"
      config={FIXED_DEPOSIT_CONFIG}
      mode="create"
      template={template}
      initialDraft={initialDraft}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { FineractHttpError } from '@mifos/api-client';
import { notFound, redirect } from 'next/navigation';
import { DepositProductWizard } from '@/components/products/deposit/wizard/deposit-product-wizard';
import { RECURRING_DEPOSIT_CONFIG } from '@/lib/fineract/deposit-product-config';
import {
  depositProductDraftFromTemplate,
  enrichDepositProductTemplate
} from '@/lib/fineract/deposit-product-draft';
import { getDepositProductForEdit } from '@/lib/fineract/deposit-products';
import { getServerSession } from '@/lib/session/server';

export default async function EditRecurringDepositProductPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.recurringDeposit.update'));
  } catch {
    redirect('/forbidden');
  }

  const { productId } = await params;

  let rawTemplate;
  try {
    rawTemplate = await getDepositProductForEdit('recurring', productId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const template = await enrichDepositProductTemplate(rawTemplate);
  const initialDraft = depositProductDraftFromTemplate('recurring', template);

  return (
    <DepositProductWizard
      kind="recurring"
      config={RECURRING_DEPOSIT_CONFIG}
      mode="edit"
      template={template}
      initialDraft={initialDraft}
      productId={productId}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { ShareProductWizard } from '@/components/products/share/wizard/share-product-wizard';
import {
  enrichShareProductTemplate,
  shareProductDraftFromTemplate
} from '@/lib/fineract/share-product-draft';
import { getShareProductTemplate } from '@/lib/fineract/share-products';
import { getServerSession } from '@/lib/session/server';

export default async function CreateShareProductPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.share.create'));
  } catch {
    redirect('/forbidden');
  }

  const rawTemplate = await getShareProductTemplate();
  const template = await enrichShareProductTemplate(rawTemplate);
  const initialDraft = shareProductDraftFromTemplate(template);

  return (
    <ShareProductWizard mode="create" template={template} initialDraft={initialDraft} />
  );
}

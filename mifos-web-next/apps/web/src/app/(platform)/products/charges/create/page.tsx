/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { ChargeWizard } from '@/components/products/charges/charge-form-page';
import { chargeWizardDraftFromTemplate, getChargeFormTemplate } from '@/lib/fineract/charges';
import { getServerSession } from '@/lib/session/server';

export default async function CreateChargePage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.charges.create'));
  } catch {
    redirect('/forbidden');
  }

  const template = await getChargeFormTemplate();
  const initialDraft = chargeWizardDraftFromTemplate('create', template);

  return <ChargeWizard mode="create" template={template} initialDraft={initialDraft} />;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { ChargeWizard } from '@/components/products/charges/charge-form-page';
import { chargeWizardDraftFromTemplate, getChargeForEdit } from '@/lib/fineract/charges';
import { getServerSession } from '@/lib/session/server';

export default async function EditChargePage({
  params
}: {
  params: Promise<{ chargeId: string }>;
}) {
  const { chargeId } = await params;
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.charges.update'));
  } catch {
    redirect('/forbidden');
  }

  let template;
  try {
    template = await getChargeForEdit(chargeId);
  } catch {
    notFound();
  }

  const initialDraft = chargeWizardDraftFromTemplate('edit', template);

  return (
    <ChargeWizard
      mode="edit"
      template={template}
      initialDraft={initialDraft}
      chargeId={chargeId}
    />
  );
}

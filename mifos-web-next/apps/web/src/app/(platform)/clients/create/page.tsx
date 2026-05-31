/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { CreateClientWizard } from '@/components/clients/create/create-client-wizard';
import { getAddressFieldConfiguration, getClientTemplate } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export default async function CreateClientPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    redirect('/forbidden');
  }

  const [template, addressFieldConfig] = await Promise.all([
    getClientTemplate(),
    getAddressFieldConfiguration().catch(() => [] as Awaited<ReturnType<typeof getAddressFieldConfiguration>>)
  ]);

  return (
    <CreateClientWizard initialTemplate={template} addressFieldConfig={addressFieldConfig} />
  );
}

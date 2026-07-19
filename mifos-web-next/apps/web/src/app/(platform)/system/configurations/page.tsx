/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlobalConfigurationsPageContent } from '@/components/system/global-configurations-page-content';
import { listGlobalConfigurations } from '@/lib/fineract/global-configurations';
import { getServerSession } from '@/lib/session/server';

export default async function GlobalConfigurationsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.configurations'))) {
    notFound();
  }

  const configurations = await listGlobalConfigurations();
  const canUpdate = can(session, 'UPDATE_CONFIGURATION');

  return (
    <GlobalConfigurationsPageContent configurations={configurations} canUpdate={canUpdate} />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { MakerCheckerPageContent } from '@/components/system/maker-checker-page-content';
import { listGlobalConfigurations } from '@/lib/fineract/global-configurations';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { getServerSession } from '@/lib/session/server';

export default async function ConfigureMakerCheckerTasksPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.makerChecker'))) {
    notFound();
  }

  const [permissions, globalConfigurations] = await Promise.all([
    listMakerCheckerPermissions(),
    listGlobalConfigurations()
  ]);

  const makerCheckerConfig = globalConfigurations.find(
    (configuration) => configuration.name === 'maker-checker'
  );

  return (
    <MakerCheckerPageContent
      permissions={permissions}
      canUpdate={can(session, 'UPDATE_PERMISSION')}
      makerCheckerGloballyEnabled={makerCheckerConfig?.enabled ?? null}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ExternalEventsPageContent } from '@/components/system/external-events-page-content';
import { listExternalEventConfiguration } from '@/lib/fineract/external-events';
import { getServerSession } from '@/lib/session/server';

export default async function ExternalEventsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.externalEvents'))) {
    notFound();
  }

  const events = await listExternalEventConfiguration();
  const canUpdate = can(session, 'UPDATE_EXTERNAL_EVENT_CONFIGURATION');

  return <ExternalEventsPageContent events={events} canUpdate={canUpdate} />;
}

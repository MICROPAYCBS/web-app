'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalEventConfigurationItem } from '@mifos/api-client';
import { ListPage } from '@/components/composites/list-page';
import { ExternalEventsTable } from '@/components/system/external-events-table';

export function ExternalEventsPageContent({
  events,
  canUpdate
}: {
  events: FineractExternalEventConfigurationItem[];
  canUpdate: boolean;
}) {
  return (
    <ListPage
      title="External events"
      description="Enable or disable event types published to external systems. Changes apply when you save."
    >
      <ExternalEventsTable events={events} canUpdate={canUpdate} />
    </ListPage>
  );
}

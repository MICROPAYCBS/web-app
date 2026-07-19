'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { ListPage } from '@/components/composites/list-page';
import { GlobalConfigurationsTable } from '@/components/system/global-configurations-table';

export function GlobalConfigurationsPageContent({
  configurations,
  canUpdate
}: {
  configurations: FineractGlobalConfiguration[];
  canUpdate: boolean;
}) {
  return (
    <ListPage
      title="Global configurations"
      description="Enable or disable platform-wide settings and update optional values where supported."
    >
      <GlobalConfigurationsTable configurations={configurations} canUpdate={canUpdate} />
    </ListPage>
  );
}

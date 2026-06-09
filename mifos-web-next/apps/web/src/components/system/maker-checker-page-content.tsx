'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { ListPage } from '@/components/composites/list-page';
import { MakerCheckerGuidance } from '@/components/system/maker-checker-guidance';
import { MakerCheckerPermissionsPanel } from '@/components/system/maker-checker-permissions-panel';

export function MakerCheckerPageContent({
  permissions,
  canUpdate,
  makerCheckerGloballyEnabled
}: {
  permissions: FineractRolePermissionUsage[];
  canUpdate: boolean;
  makerCheckerGloballyEnabled: boolean | null;
}) {
  return (
    <ListPage
      title={
        <span className="inline-flex items-center gap-1.5">
          Configure maker checker tasks
          <MakerCheckerGuidance />
        </span>
      }
      description="Choose which actions require a checker to approve before they take effect."
    >
      {makerCheckerGloballyEnabled === false ? (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Maker-checker is currently disabled in global configurations. You can still save task
          settings here; they will apply once maker-checker is enabled globally.
        </p>
      ) : null}

      <MakerCheckerPermissionsPanel permissions={permissions} canUpdate={canUpdate} />
    </ListPage>
  );
}

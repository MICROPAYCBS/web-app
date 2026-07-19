'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractServerProfile } from '@mifos/servers';
import type { ServerHealthSnapshot } from '@/components/servers/server-health-indicator';
import { ServerDetailsTooltip } from '@/components/servers/server-details-tooltip';

export function ServerRowDetailsTooltip({
  server,
  health,
  isActive,
  children
}: {
  server: FineractServerProfile;
  health?: ServerHealthSnapshot;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ServerDetailsTooltip server={server} health={health} isActive={isActive}>
      <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
    </ServerDetailsTooltip>
  );
}

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
import { ServerHealthBadge } from '@/components/servers/server-health-badge';

export function LoginActiveServer({
  server,
  health
}: {
  server: FineractServerProfile;
  health?: ServerHealthSnapshot;
}) {
  return (
    <ServerDetailsTooltip server={server} health={health} side="top">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <span className="min-w-0 truncate font-medium">{server.name}</span>
        <ServerHealthBadge health={health} />
      </div>
    </ServerDetailsTooltip>
  );
}

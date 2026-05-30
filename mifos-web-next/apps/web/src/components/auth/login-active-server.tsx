'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getFineractApiHost, isDeprecatedDemoFineractHost } from '@mifos/servers';
import type { FineractServerProfile } from '@mifos/servers';
import type { ServerHealthSnapshot } from '@/components/servers/server-health-indicator';
import { ServerDetailsTooltip } from '@/components/servers/server-details-tooltip';
import { cn } from '@/lib/utils';
import { ServerHealthBadge } from '@/components/servers/server-health-badge';

export function LoginActiveServer({
  server,
  health,
  className
}: {
  server: FineractServerProfile;
  health?: ServerHealthSnapshot;
  className?: string;
}) {
  return (
    <ServerDetailsTooltip server={server} health={health} side="top" className={cn(className)}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <span className="min-w-0">
          <span className="block truncate font-medium">{server.name}</span>
          <span
            className={cn(
              'block truncate text-xs text-muted-foreground',
              isDeprecatedDemoFineractHost(server.baseUrl) && 'text-amber-700 dark:text-amber-400'
            )}
          >
            {getFineractApiHost(server.baseUrl)}
          </span>
        </span>
        <ServerHealthBadge health={health} />
      </div>
    </ServerDetailsTooltip>
  );
}

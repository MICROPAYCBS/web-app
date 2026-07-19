'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronRightIcon } from 'lucide-react';
import { getFineractApiHost, isDeprecatedDemoFineractHost } from '@mifos/servers';
import type { FineractServerProfile } from '@mifos/servers';
import { ServerDetailsTooltip } from '@/components/servers/server-details-tooltip';
import { cn } from '@/lib/utils';

export function LoginActiveServer({
  server,
  onManageServers,
  className
}: {
  server: FineractServerProfile;
  onManageServers: () => void;
  className?: string;
}) {
  return (
    <ServerDetailsTooltip
      server={server}
      side="top"
      onClick={onManageServers}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/60',
        className
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium uppercase tracking-wide">Server</span>
        <span className="block truncate text-sm font-medium text-foreground">{server.name}</span>
        <span
          className={cn(
            'block truncate text-xs text-muted-foreground',
            isDeprecatedDemoFineractHost(server.baseUrl) && 'text-amber-700 dark:text-amber-400'
          )}
        >
          {getFineractApiHost(server.baseUrl)}
        </span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </ServerDetailsTooltip>
  );
}

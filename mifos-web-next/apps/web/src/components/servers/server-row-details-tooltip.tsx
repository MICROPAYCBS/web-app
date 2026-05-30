'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractServerProfile } from '@mifos/servers';
import {
  getServerHealthLabel,
  type ServerHealthSnapshot
} from '@/components/servers/server-health-indicator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

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
  const healthLabel = health ? getServerHealthLabel(health) : null;

  return (
    <Tooltip>
      <TooltipTrigger
        className="flex min-w-0 flex-1 cursor-default items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="left" align="start" className="max-w-xs">
        <div className="flex flex-col gap-1 text-left">
          {isActive ? <p className="font-medium">Active server</p> : null}
          {healthLabel ? <p>{healthLabel}</p> : null}
          <p>Tenant: {server.tenantId}</p>
          <p className="break-all opacity-90">{server.baseUrl}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

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

export type ServerDetails = Pick<FineractServerProfile, 'name' | 'tenantId' | 'baseUrl'>;

export function ServerDetailsTooltipContent({
  server,
  health,
  isActive
}: {
  server: ServerDetails;
  health?: ServerHealthSnapshot;
  isActive?: boolean;
}) {
  const healthLabel = health ? getServerHealthLabel(health) : null;

  return (
    <div className="flex flex-col gap-1 text-left">
      {isActive ? <p className="font-medium">Active server</p> : null}
      {healthLabel ? <p>{healthLabel}</p> : null}
      <p>Tenant: {server.tenantId}</p>
      <p className="break-all opacity-90">{server.baseUrl}</p>
    </div>
  );
}

export function ServerDetailsTooltip({
  server,
  health,
  isActive,
  side = 'left',
  children
}: {
  server: ServerDetails;
  health?: ServerHealthSnapshot;
  isActive?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="w-full cursor-default rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align="start" className="max-w-xs">
        <ServerDetailsTooltipContent server={server} health={health} isActive={isActive} />
      </TooltipContent>
    </Tooltip>
  );
}

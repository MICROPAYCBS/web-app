'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import {
  SERVER_STATUS_LIGHT_CLASS,
  type ServerHealthSnapshot
} from '@/components/servers/server-health-indicator';
import { ServerListRowActions } from '@/components/servers/server-list-row-actions';
import { ServerRowDetailsTooltip } from '@/components/servers/server-row-details-tooltip';
import { cn } from '@/lib/utils';
import { deleteServerAction, selectServerAction } from '@/actions/servers';

export function ServerManagerRow({
  server,
  isActive,
  health,
  onEdit,
  onChanged
}: {
  server: FineractServerProfile;
  isActive: boolean;
  health: ServerHealthSnapshot;
  onEdit: (server: FineractServerProfile) => void;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <ServerRowDetailsTooltip server={server} health={health} isActive={isActive}>
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <ServerStatusLight health={health} />
            <span className="min-w-0 truncate font-medium">
              {server.name}
              {isActive ? (
                <span className="ml-1.5 text-xs font-normal text-primary">(active)</span>
              ) : null}
            </span>
          </span>
        </ServerRowDetailsTooltip>
        <ServerListRowActions
          isActive={isActive}
          pending={pending}
          onUse={() =>
            startTransition(async () => {
              const result = await selectServerAction(server.id);
              if (result.ok) {
                onChanged();
              }
            })
          }
          onEdit={() => onEdit(server)}
          onRemove={() =>
            startTransition(async () => {
              const result = await deleteServerAction(server.id);
              if (result.ok) {
                onChanged();
              }
            })
          }
        />
      </div>
    </li>
  );
}

function ServerStatusLight({
  health,
  className
}: {
  health: ServerHealthSnapshot;
  className?: string;
}) {
  if (health.status === 'idle') {
    return (
      <span
        className={cn('size-3 shrink-0 rounded-full bg-muted-foreground/30', className)}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        'size-3 shrink-0 rounded-full',
        SERVER_STATUS_LIGHT_CLASS[health.status],
        className
      )}
      role="status"
      aria-label={health.status}
    />
  );
}

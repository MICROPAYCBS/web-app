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
import { ServerRowDetailsTooltip } from '@/components/servers/server-row-details-tooltip';
import { Button } from '@/components/ui/button';
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
          <ServerStatusLight health={health} />
          <span className="min-w-0 flex-1 truncate font-medium">
            {server.name}
            {isActive ? (
              <span className="ml-1.5 text-xs font-normal text-primary">(active)</span>
            ) : null}
          </span>
        </ServerRowDetailsTooltip>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {!isActive ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await selectServerAction(server.id);
                  if (result.ok) {
                    onChanged();
                  }
                })
              }
            >
              Use this server
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(server)}>
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteServerAction(server.id);
                if (result.ok) {
                  onChanged();
                }
              })
            }
          >
            Remove
          </Button>
        </div>
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

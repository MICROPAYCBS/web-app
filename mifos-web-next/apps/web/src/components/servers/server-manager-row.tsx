'use client';

import { useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import {
  ServerHealthIndicator,
  type ServerHealthSnapshot
} from '@/components/servers/server-health-indicator';
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
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ServerStatusLight health={health} className="mt-1" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {server.name}
              {isActive ? (
                <span className="ml-2 text-xs font-normal text-primary">(active)</span>
              ) : null}
            </p>
            <ServerHealthIndicator health={health} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Tenant: {server.tenantId}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{server.baseUrl}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-5">
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
        title="Status not checked yet"
      />
    );
  }

  const lampClass =
    health.status === 'probing'
      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.75)] animate-pulse'
      : health.status === 'healthy'
        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]'
        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.55)]';

  return <span className={cn('size-3 shrink-0 rounded-full', lampClass, className)} />;
}

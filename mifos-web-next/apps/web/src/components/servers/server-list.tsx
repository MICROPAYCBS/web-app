'use client';

import { useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import { selectServerAndGoToLoginAction } from '@/actions/servers';
import { cn } from '@/lib/utils';

export function ServerList({
  servers,
  activeServerId
}: {
  servers: FineractServerProfile[];
  activeServerId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (servers.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {servers.map((server) => {
        const isActive = server.id === activeServerId;
        return (
          <li key={server.id}>
            <button
              type="button"
              disabled={pending}
              className={cn(
                'flex w-full flex-col rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50',
                isActive && 'border-primary ring-1 ring-primary'
              )}
              onClick={() =>
                startTransition(() => selectServerAndGoToLoginAction(server.id))
              }
            >
              <span className="font-medium">{server.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Tenant: {server.tenantId}
              </span>
              <span className="mt-0.5 truncate text-xs text-muted-foreground">{server.baseUrl}</span>
              {isActive ? (
                <span className="mt-2 text-xs font-medium text-primary">Selected</span>
              ) : (
                <span className="mt-2 text-xs text-muted-foreground">Click to use this server</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

import { Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import { selectServerAction } from '@/actions/servers';
import { EmptyState } from '@/components/composites';
import { finishServerSelection } from '@/lib/servers/finish-server-selection';
import { cn } from '@/lib/utils';

export function ServerList({
  servers,
  activeServerId,
  onSelected
}: {
  servers: FineractServerProfile[];
  activeServerId: string | null;
  /** Called after the active server cookie is updated (e.g. close sheet). */
  onSelected?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (servers.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title="No servers yet"
        description="Add a server below to sign in and use the app."
      />
    );
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
                startTransition(async () => {
                  const result = await selectServerAction(server.id);
                  finishServerSelection(result, router, onSelected);
                })
              }
            >
              <span className="font-medium">{server.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">Tenant: {server.tenantId}</span>
              <span className="mt-0.5 truncate text-xs text-muted-foreground">
                {server.baseUrl}
              </span>
              {isActive ? (
                <span className="mt-2 text-xs font-medium text-primary">Active for sign-in</span>
              ) : (
                <span className="mt-2 text-xs text-muted-foreground">Tap to use this server</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

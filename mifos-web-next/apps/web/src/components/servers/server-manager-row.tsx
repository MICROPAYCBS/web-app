'use client';

import { useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import { Button } from '@/components/ui/button';
import { deleteServerAction, selectServerAction } from '@/actions/servers';

export function ServerManagerRow({
  server,
  isActive,
  onEdit,
  onChanged
}: {
  server: FineractServerProfile;
  isActive: boolean;
  onEdit: (server: FineractServerProfile) => void;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {server.name}
            {isActive ? (
              <span className="ml-2 text-xs font-normal text-primary">(active)</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">Tenant: {server.tenantId}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{server.baseUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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

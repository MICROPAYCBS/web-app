'use client';

import { useState, useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import { Button } from '@/components/ui/button';
import { ServerForm, type ServerFormValues } from '@/components/servers/server-form';
import {
  deleteServerAction,
  selectServerAction,
  updateServerAction
} from '@/actions/servers';

export function ServerSettingsRow({
  server,
  isActive
}: {
  server: FineractServerProfile;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const initial: ServerFormValues = {
    name: server.name,
    baseUrl: server.baseUrl,
    tenantId: server.tenantId
  };

  return (
    <li className="rounded-lg border border-border p-4">
      {!editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
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
                    await selectServerAction(server.id);
                  })
                }
              >
                Use this server
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteServerAction(server.id);
                })
              }
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ServerForm
            initialValues={initial}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              const result = await updateServerAction(server.id, values);
              if (result.ok) {
                setEditing(false);
              }
              return result;
            }}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </li>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import { Button } from '@/components/ui/button';
import { ServerForm, type ServerFormValues } from '@/components/servers/server-form';
import { ServerRowDetailsTooltip } from '@/components/servers/server-row-details-tooltip';
import {
  deleteServerAction,
  selectServerAction,
  updateServerAction
} from '@/actions/servers';

export function ServerSettingsRow({
  server,
  isActive,
  onChanged
}: {
  server: FineractServerProfile;
  isActive: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const initial: ServerFormValues = {
    name: server.name,
    baseUrl: server.baseUrl,
    tenantId: server.tenantId
  };

  function afterSuccess() {
    router.refresh();
    onChanged?.();
  }

  return (
    <li className="rounded-lg border border-border p-4">
      {!editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ServerRowDetailsTooltip server={server} isActive={isActive}>
            <span className="min-w-0 truncate font-medium">
              {server.name}
              {isActive ? (
                <span className="ml-1.5 text-xs font-normal text-primary">(active)</span>
              ) : null}
            </span>
          </ServerRowDetailsTooltip>
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
                      afterSuccess();
                    }
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
                  const result = await deleteServerAction(server.id);
                  if (result.ok) {
                    afterSuccess();
                  }
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
                afterSuccess();
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

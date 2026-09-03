'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { getFineractApiHost, type FineractServerProfile } from '@mifos/servers';
import { Button } from '@/components/ui/button';
import { ServerListRowActions } from '@/components/servers/server-list-row-actions';
import { ServerForm, type ServerFormValues } from '@/components/servers/server-form';
import { ServerRowDetailsTooltip } from '@/components/servers/server-row-details-tooltip';
import {
  deleteServerAction,
  selectServerAction,
  updateServerAction
} from '@/actions/servers';
import { finishServerSelection } from '@/lib/servers/finish-server-selection';

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

  function afterSuccess(signedOut?: boolean) {
    if (signedOut) {
      window.location.assign('/login');
      return;
    }
    router.refresh();
    onChanged?.();
  }

  return (
    <li className="rounded-lg border border-border p-4">
      {!editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ServerRowDetailsTooltip server={server} isActive={isActive}>
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {server.name}
                {isActive ? (
                  <span className="ml-1.5 text-xs font-normal text-primary">(active)</span>
                ) : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Tenant: {server.tenantId}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {getFineractApiHost(server.baseUrl)}
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
                  afterSuccess(result.signedOut);
                }
              })
            }
            onEdit={() => setEditing(true)}
            onRemove={() =>
              startTransition(async () => {
                const result = await deleteServerAction(server.id);
                if (result.ok) {
                  afterSuccess();
                }
              })
            }
          />
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

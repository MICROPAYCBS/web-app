'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { FineractServerProfile, ServerCatalog } from '@mifos/servers';
import { addServerAction, updateServerAction } from '@/actions/servers';
import { ServerManagerRow } from '@/components/servers/server-manager-row';
import { useServerHealth } from '@/components/servers/use-server-health';
import { ServerForm, type ServerFormValues } from '@/components/servers/server-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

type SheetView =
  | { mode: 'list' }
  | { mode: 'add' }
  | { mode: 'edit'; server: FineractServerProfile };

export function ServerManagerSheet({
  catalog,
  open,
  onOpenChange
}: {
  catalog: ServerCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<SheetView>({ mode: 'list' });
  const isEmpty = catalog.servers.length === 0;
  const { getHealth, refresh: refreshHealth } = useServerHealth(catalog.servers, open && view.mode === 'list');

  function refreshAfterMutation() {
    router.refresh();
    void refreshHealth();
  }

  function showList() {
    setView({ mode: 'list' });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setView({ mode: 'list' });
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle>
            {view.mode === 'add'
              ? 'Add server'
              : view.mode === 'edit'
                ? 'Edit server'
                : 'Servers'}
          </SheetTitle>
          {view.mode === 'list' ? (
            <SheetDescription>Tap a server to use it for sign-in.</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {view.mode === 'list' ? (
            <div className="space-y-3">
              {isEmpty ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No servers yet. Use <span className="font-medium">Add server</span> below.
                </p>
              ) : (
                <ul className="space-y-3">
                  {catalog.servers.map((server) => (
                    <ServerManagerRow
                      key={server.id}
                      server={server}
                      isActive={server.id === catalog.activeServerId}
                      onEdit={(s) => setView({ mode: 'edit', server: s })}
                      health={getHealth(server.id)}
                      onChanged={refreshAfterMutation}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <ServerForm
              key={view.mode === 'edit' ? view.server.id : 'add'}
              initialValues={
                view.mode === 'edit'
                  ? {
                      name: view.server.name,
                      baseUrl: view.server.baseUrl,
                      tenantId: view.server.tenantId
                    }
                  : undefined
              }
              submitLabel={view.mode === 'add' ? 'Save server' : 'Save changes'}
              onSubmit={async (values: ServerFormValues) => {
                const result =
                  view.mode === 'add'
                    ? await addServerAction(values)
                    : await updateServerAction(view.server.id, values);
                if (result.ok) {
                  refreshAfterMutation();
                  showList();
                  if (view.mode === 'add' && isEmpty) {
                    onOpenChange(false);
                  }
                }
                return result;
              }}
            />
          )}
        </div>

        <SheetFooter className="mt-auto border-t border-border px-4 py-4">
          {view.mode === 'list' ? (
            <Button type="button" className="w-full" onClick={() => setView({ mode: 'add' })}>
              <PlusIcon className="size-4" />
              Add server
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full" onClick={showList}>
              Back to server list
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

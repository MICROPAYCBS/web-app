'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import type { ServerCatalog } from '@mifos/servers';
import { addServerAction } from '@/actions/servers';
import { ServerSettingsRow } from '@/components/servers/server-settings-row';
import { ServerForm } from '@/components/servers/server-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

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
  const isEmpty = catalog.servers.length === 0;

  function refreshAfterMutation() {
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Fineract servers</SheetTitle>
          <SheetDescription>
            Add, edit, or remove backends. The active server is used when you sign in.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 py-4">
          <section className="space-y-3 px-4">
            <h3 className="text-sm font-medium text-muted-foreground">Your servers</h3>
            {isEmpty ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No servers yet. Add a Fineract instance below.
              </p>
            ) : (
              <ul className="space-y-3">
                {catalog.servers.map((server) => (
                  <ServerSettingsRow
                    key={server.id}
                    server={server}
                    isActive={server.id === catalog.activeServerId}
                    onChanged={refreshAfterMutation}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 border-t border-border px-4 pt-4">
            <h3 className="text-sm font-medium">
              {isEmpty ? 'Add your first server' : 'Add another server'}
            </h3>
            <ServerForm
              submitLabel={isEmpty ? 'Save server' : 'Add server'}
              onSubmit={(values) =>
                addServerAction(values).then((result) => {
                  if (result.ok) {
                    refreshAfterMutation();
                    if (isEmpty) {
                      onOpenChange(false);
                    }
                  }
                  return result;
                })
              }
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

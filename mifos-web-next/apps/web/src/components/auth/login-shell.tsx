'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import type { ServerCatalog } from '@mifos/servers';
import { LoginForm } from '@/components/auth/login-form';
import { ServerManagerSheet } from '@/components/servers/server-manager-sheet';

export function LoginShell({
  catalog,
  redirectTo,
  signedOut,
  demoEnabled,
  initialServersOpen = false
}: {
  catalog: ServerCatalog;
  redirectTo: string;
  signedOut: boolean;
  demoEnabled: boolean;
  initialServersOpen?: boolean;
}) {
  const [serversOpen, setServersOpen] = useState(initialServersOpen);
  const active = catalog.servers.find((s) => s.id === catalog.activeServerId);

  return (
    <>
      <LoginForm
        redirectTo={redirectTo}
        signedOut={signedOut}
        demoEnabled={demoEnabled}
        canSignIn={Boolean(active)}
        serverName={active?.name ?? 'No server selected'}
        tenantId={active?.tenantId ?? '—'}
        onManageServers={() => setServersOpen(true)}
      />
      <ServerManagerSheet
        catalog={catalog}
        open={serversOpen}
        onOpenChange={setServersOpen}
      />
    </>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ServerCatalog } from '@mifos/servers';
import { LoginForm } from '@/components/auth/login-form';
import { ServerManagerSheet } from '@/components/servers/server-manager-sheet';
import { useServerHealth } from '@/components/servers/use-server-health';

export function LoginShell({
  catalog,
  redirectTo,
  signedOut,
  demoEnabled,
  loginError = null,
  initialServersOpen = false
}: {
  catalog: ServerCatalog;
  redirectTo: string;
  signedOut: boolean;
  demoEnabled: boolean;
  loginError?: string | null;
  /** Only true when URL has ?servers=1 and no active server (see login page). */
  initialServersOpen?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [serversOpen, setServersOpen] = useState(initialServersOpen);
  const active = catalog.servers.find((s) => s.id === catalog.activeServerId);
  const activeList = useMemo(() => (active ? [active] : []), [active]);
  const { getHealth } = useServerHealth(activeList, Boolean(active));

  function stripServersQueryParam() {
    if (searchParams.get('servers') !== '1') {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete('servers');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleServersOpenChange(open: boolean) {
    if (!open) {
      stripServersQueryParam();
    }
    setServersOpen(open);
  }

  return (
    <>
      <LoginForm
        redirectTo={redirectTo}
        signedOut={signedOut}
        demoEnabled={demoEnabled}
        loginError={loginError}
        canSignIn={Boolean(active)}
        activeServer={active}
        onManageServers={() => setServersOpen(true)}
        serverHealth={active ? getHealth(active.id) : undefined}
      />
      <ServerManagerSheet
        catalog={catalog}
        open={serversOpen}
        onOpenChange={handleServersOpenChange}
      />
    </>
  );
}

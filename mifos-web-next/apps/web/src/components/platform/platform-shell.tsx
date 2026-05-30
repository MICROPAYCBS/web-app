'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { AppShell } from '@mifos/ui';
import { NavigationProvider } from '@/components/platform/navigation-provider';
import { PlatformHeader } from '@/components/platform/platform-header';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';
import { QuickFind } from '@/components/platform/quick-find';
import type { PlatformNavStructure } from '@/components/platform/navigation-types';

export function PlatformShell({
  nav,
  serverName,
  children
}: {
  nav: PlatformNavStructure;
  serverName?: string | null;
  children: ReactNode;
}) {
  return (
    <NavigationProvider nav={nav}>
      <AppShell sidebar={<PlatformSidebar />} header={<PlatformHeader serverName={serverName} />}>
        {children}
      </AppShell>
      <QuickFind />
    </NavigationProvider>
  );
}

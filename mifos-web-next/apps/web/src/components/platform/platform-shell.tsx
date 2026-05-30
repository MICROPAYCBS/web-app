'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CSSProperties, ReactNode } from 'react';
import { MifosAppSidebar } from '@/components/platform/mifos-app-sidebar';
import { MifosSiteHeader } from '@/components/platform/mifos-site-header';
import { NavigationProvider } from '@/components/platform/navigation-provider';
import { QuickFind } from '@/components/platform/quick-find';
import type { PlatformNavStructure } from '@/components/platform/navigation-types';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const shellStyle = {
  '--sidebar-width': 'calc(var(--spacing) * 72)',
  '--header-height': 'calc(var(--spacing) * 12)'
} as CSSProperties;

/**
 * Authenticated shell — shadcn dashboard-01 layout + Mifos nav / Quick Find.
 */
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
      <SidebarProvider style={shellStyle}>
        <MifosAppSidebar serverName={serverName} />
        <SidebarInset>
          <MifosSiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <QuickFind />
    </NavigationProvider>
  );
}

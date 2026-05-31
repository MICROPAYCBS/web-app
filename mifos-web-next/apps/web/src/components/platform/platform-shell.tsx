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
import type { PlatformNavStructure } from '@/components/platform/navigation-types';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const shellStyle = {
  '--sidebar-width': 'calc(var(--spacing) * 72)',
  '--header-height': 'calc(var(--spacing) * 12)'
} as CSSProperties;

/**
 * Authenticated shell — shadcn dashboard-01 layout + Vercel-style sidebar nav Find.
 * Site header stays fixed; main content scrolls beneath it.
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
        <SidebarInset className="flex max-h-svh min-h-svh flex-col overflow-hidden">
          <MifosSiteHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NavigationProvider>
  );
}

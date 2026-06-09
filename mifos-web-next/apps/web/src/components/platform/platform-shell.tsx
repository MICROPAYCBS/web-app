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
import { EntitySearchProvider } from '@/components/platform/entity-search-provider';
import { MifosSiteHeader } from '@/components/platform/mifos-site-header';
import { NavigationProvider } from '@/components/platform/navigation-provider';
import type { PlatformNavStructure } from '@/components/platform/navigation-types';
import { ErrorBoundary } from '@/components/composites/error-boundary';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const shellStyle = {
  '--sidebar-width': 'calc(var(--spacing) * 72)',
  '--header-height': 'calc(var(--spacing) * 12)'
} as CSSProperties;

/**
 * Authenticated shell — shadcn dashboard-01 layout + sidebar nav Find (F) + header entity search (⌘K).
 * Site header stays fixed. List/detail pages scroll in their body region; simple pages scroll in main.
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
      <EntitySearchProvider>
        <SidebarProvider style={shellStyle}>
          <MifosAppSidebar serverName={serverName} />
          <SidebarInset className="flex max-h-svh min-h-svh flex-col overflow-hidden">
            <MifosSiteHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ErrorBoundary
                title="This section failed to load"
                description="Something went wrong while rendering this page. The sidebar and header are still available."
              >
                <div className="@container/main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  {children}
                </div>
              </ErrorBoundary>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </EntitySearchProvider>
    </NavigationProvider>
  );
}

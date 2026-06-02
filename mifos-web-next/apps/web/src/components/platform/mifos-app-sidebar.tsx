'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MifosNavUser } from '@/components/platform/mifos-nav-user';
import { QuickCreate } from '@/components/platform/quick-create';
import { SidebarNavFind } from '@/components/platform/sidebar-nav-find';
import { SidebarNavPanel } from '@/components/platform/sidebar-nav-panel';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

/** dashboard-01 sidebar with Vercel-style Find + group drill-down navigation. */
export function MifosAppSidebar({
  serverName,
  ...props
}: React.ComponentProps<typeof Sidebar> & { serverName?: string | null }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                M
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Mifos Web</span>
                <span className="truncate text-xs text-muted-foreground">
                  {serverName ?? 'Server'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
          <SidebarNavFind />
          <QuickCreate />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarNavPanel />
      </SidebarContent>

      <SidebarFooter>
        <MifosNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

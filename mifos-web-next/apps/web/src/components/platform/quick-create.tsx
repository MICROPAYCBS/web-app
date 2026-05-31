'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CirclePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Can, resolvePermission } from '@mifos/auth';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

/** Primary platform action — Create client (below sidebar Find). */
export function QuickCreate() {
  const router = useRouter();

  return (
    <Can permission={resolvePermission('clients.create')}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Create client"
            className="h-8 w-full min-w-0 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            onClick={() => router.push('/clients?create=1')}
          >
            <CirclePlus className="size-4 shrink-0" />
            <span className="truncate">Create client</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </Can>
  );
}

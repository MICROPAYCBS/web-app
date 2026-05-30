'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { NavIcon } from '@/components/platform/nav-icon';
import { MifosNavUser } from '@/components/platform/mifos-nav-user';
import { useNavigation } from '@/components/platform/navigation-provider';
import type { PlatformNavLink } from '@/components/platform/navigation-types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenuLink({ item }: { item: PlatformNavLink }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const soon = item.status === 'soon';

  if (soon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={item.label}
          className="cursor-not-allowed opacity-70"
        >
          <NavIcon name={item.icon} className="size-4" />
          <span>{item.label}</span>
          <Badge variant="outline" className="ml-auto text-[10px] font-normal">
            Soon
          </Badge>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.label}
        render={<Link href={item.href} />}
      >
        <NavIcon name={item.icon} className="size-4" />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** dashboard-01 sidebar wired to {@link APP_ROUTES} nav structure. */
export function MifosAppSidebar({
  serverName,
  ...props
}: React.ComponentProps<typeof Sidebar> & { serverName?: string | null }) {
  const { nav } = useNavigation();

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
                  {serverName ?? 'Fineract'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {nav.featured.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Quick access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.featured.map((item) => (
                  <NavMenuLink key={item.id} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {nav.groups.map((group) => (
          <Collapsible key={group.id} defaultOpen={group.defaultOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel
                render={
                  <CollapsibleTrigger className="flex w-full items-center">
                    <ChevronRight className="mr-1 size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    {group.label}
                  </CollapsibleTrigger>
                }
              />
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <NavMenuLink key={item.id} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <MifosNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

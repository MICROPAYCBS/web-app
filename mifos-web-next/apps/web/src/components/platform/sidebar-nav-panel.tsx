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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NavIcon } from '@/components/platform/nav-icon';
import { useNavigation } from '@/components/platform/navigation-provider';
import type { PlatformNavGroup, PlatformNavLink } from '@/components/platform/navigation-types';
import {
  filterNavGroups,
  filterNavLinks,
  flattenMatchingNavLinks,
  isNavPathActive,
  matchesNavFindQuery
} from '@/components/platform/navigation-utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

function NavMenuLink({ item }: { item: PlatformNavLink }) {
  const pathname = usePathname();
  const active = isNavPathActive(pathname, item.href);
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

function SidebarNavGroupView({ group }: { group: PlatformNavGroup }) {
  const { findQuery, exitGroup } = useNavigation();
  const items = filterNavLinks(group.items, findQuery);

  return (
    <>
      <SidebarGroup className="px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="font-medium"
              onClick={exitGroup}
              tooltip="Back"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{group.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="px-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {items.length > 0 ? (
              items.map((item) => <NavMenuLink key={item.id} item={item} />)
            ) : (
              <SidebarMenuItem>
                <p className="px-2 py-3 text-xs text-muted-foreground">No matching pages.</p>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

function SidebarNavRootView() {
  const { nav, findQuery, enterGroup } = useNavigation();
  const query = findQuery.trim();
  const featured = filterNavLinks(nav.featured, findQuery);
  const groups = filterNavGroups(nav.groups, findQuery);
  const flatResults = flattenMatchingNavLinks(nav, findQuery);

  return (
    <>
      {query ? (
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="px-2">Results</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {flatResults.length > 0 ? (
                flatResults.map((item) => <NavMenuLink key={item.id} item={item} />)
              ) : (
                <SidebarMenuItem>
                  <p className="px-2 py-3 text-xs text-muted-foreground">No matching pages.</p>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {featured.length > 0 ? (
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="px-2">Quick access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {featured.map((item) => (
                <NavMenuLink key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {groups.length > 0 ? (
        <SidebarGroup className="px-0">
          {!query ? <SidebarGroupLabel className="px-2">Sections</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.flatMap((group) => {
                const childMatches = group.items.filter((item) =>
                  matchesNavFindQuery(item, findQuery)
                );
                const showChildrenInline = query.length > 0 && childMatches.length > 0;

                if (showChildrenInline) {
                  return childMatches.map((item) => (
                    <NavMenuLink key={item.id} item={item} />
                  ));
                }

                return (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      type="button"
                      className="w-full"
                      onClick={() => enterGroup(group.id)}
                      tooltip={group.label}
                    >
                      <span className="flex-1 truncate text-left">{group.label}</span>
                      <ChevronRight className="ml-auto size-4 shrink-0 opacity-60" aria-hidden />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {!query && nav.featured.length === 0 && nav.groups.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">No navigation available.</p>
      ) : null}
    </>
  );
}

/** Root groups list or drilled-down group links (Vercel-style sidebar nav). */
export function SidebarNavPanel() {
  const { activeGroup } = useNavigation();

  if (activeGroup) {
    return <SidebarNavGroupView group={activeGroup} />;
  }

  return <SidebarNavRootView />;
}

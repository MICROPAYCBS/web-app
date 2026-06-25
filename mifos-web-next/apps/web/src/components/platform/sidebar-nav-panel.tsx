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
import type {
  PlatformNavGroup,
  PlatformNavLink,
  PlatformNavSearchResult
} from '@/components/platform/navigation-types';
import {
  filterNavGroups,
  filterNavLinks,
  isNavPathActive,
  searchNavLinks
} from '@/components/platform/navigation-utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

function NavMenuLink({
  item,
  sectionLabel
}: {
  item: PlatformNavLink;
  sectionLabel?: string;
}) {
  const pathname = usePathname();
  const active = isNavPathActive(pathname, item.href);
  const soon = item.status === 'soon';
  const tooltip = sectionLabel ? `${item.label} · ${sectionLabel}` : item.label;

  if (soon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={tooltip}
          className="cursor-not-allowed opacity-70"
        >
          <NavIcon name={item.icon} className="size-4" />
          <span className="min-w-0 flex-1 truncate">
            {item.label}
            {sectionLabel ? (
              <span className="text-muted-foreground"> · {sectionLabel}</span>
            ) : null}
          </span>
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
        tooltip={tooltip}
        render={<Link href={item.href} />}
      >
        <NavIcon name={item.icon} className="size-4" />
        <span className="min-w-0 flex-1 truncate">
          {item.label}
          {sectionLabel ? (
            <span className="text-muted-foreground"> · {sectionLabel}</span>
          ) : null}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarNavSearchResults({ results }: { results: PlatformNavSearchResult[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Results</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {results.length > 0 ? (
            results.map((result) => (
              <NavMenuLink
                key={result.link.id}
                item={result.link}
                sectionLabel={result.sectionLabel}
              />
            ))
          ) : (
            <SidebarMenuItem>
              <p className="px-2 py-3 text-xs text-muted-foreground">No matching pages.</p>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarNavGroupView({ group }: { group: PlatformNavGroup }) {
  const { nav, findQuery, exitGroup } = useNavigation();
  const query = findQuery.trim();
  const isSearching = query.length > 0;
  const items = filterNavLinks(group.items, findQuery);
  const searchResults = searchNavLinks(nav, findQuery);

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="font-medium"
              onClick={exitGroup}
              tooltip="Back"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <NavIcon name={group.icon} className="size-4 shrink-0" />
              <span className="truncate">{group.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {isSearching ? (
        <SidebarNavSearchResults results={searchResults} />
      ) : (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <NavMenuLink key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}

function SidebarNavRootView() {
  const { nav, findQuery, enterGroup } = useNavigation();
  const query = findQuery.trim();
  const isSearching = query.length > 0;
  const featured = filterNavLinks(nav.featured, findQuery);
  const groups = filterNavGroups(nav.groups, findQuery);
  const searchResults = searchNavLinks(nav, findQuery);

  if (isSearching) {
    return <SidebarNavSearchResults results={searchResults} />;
  }

  return (
    <>
      {featured.length > 0 ? (
        <SidebarGroup>
          <SidebarGroupLabel>Quick access</SidebarGroupLabel>
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
        <SidebarGroup>
          <SidebarGroupLabel>Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton
                    type="button"
                    className="w-full"
                    onClick={() => enterGroup(group.id)}
                    tooltip={group.label}
                  >
                    <NavIcon name={group.icon} className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    <ChevronRight className="ml-auto size-4 shrink-0 opacity-60" aria-hidden />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {nav.featured.length === 0 && nav.groups.length === 0 ? (
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

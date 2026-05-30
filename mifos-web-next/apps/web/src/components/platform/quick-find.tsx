'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { NavIcon } from '@/components/platform/nav-icon';
import { useNavigation } from '@/components/platform/navigation-provider';
import type { PlatformNavLink } from '@/components/platform/navigation-types';

function searchText(item: PlatformNavLink): string {
  return [item.label, item.href, ...item.keywords].join(' ').toLowerCase();
}

function NavCommandItem({
  item,
  onSelect
}: {
  item: PlatformNavLink;
  onSelect: (href: string) => void;
}) {
  const disabled = item.status === 'soon';
  return (
    <CommandItem
      value={`${item.id} ${searchText(item)}`}
      disabled={disabled}
      onSelect={() => onSelect(item.href)}
      className="gap-2"
    >
      <NavIcon name={item.icon} className="size-4 shrink-0 opacity-70" />
      <span className="flex-1 truncate">{item.label}</span>
      {disabled ? (
        <Badge variant="secondary" className="text-[10px] font-normal">
          Soon
        </Badge>
      ) : null}
    </CommandItem>
  );
}

export function QuickFind() {
  const router = useRouter();
  const { nav, quickFindOpen, closeQuickFind } = useNavigation();

  const { featured, rest } = useMemo(() => {
    const featuredIds = new Set(nav.featured.map((f) => f.id));
    return {
      featured: nav.featured,
      rest: nav.quickFind.filter((item) => !featuredIds.has(item.id))
    };
  }, [nav]);

  function go(href: string) {
    closeQuickFind();
    router.push(href);
  }

  return (
    <CommandDialog
      open={quickFindOpen}
      onOpenChange={(open) => !open && closeQuickFind()}
      title="Quick Find"
      description="Search pages and jump anywhere in Mifos Web"
      className="sm:max-w-lg"
    >
      <CommandInput placeholder="Search clients, loans, settings…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {featured.length > 0 ? (
          <CommandGroup heading="Featured">
            {featured.map((item) => (
              <NavCommandItem key={item.id} item={item} onSelect={go} />
            ))}
          </CommandGroup>
        ) : null}
        {featured.length > 0 && rest.length > 0 ? <CommandSeparator /> : null}
        {rest.length > 0 ? (
          <CommandGroup heading="All pages">
            {rest.map((item) => (
              <NavCommandItem key={item.id} item={item} onSelect={go} />
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

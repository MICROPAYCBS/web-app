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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NavIcon } from '@/components/platform/nav-icon';
import { useNavigation } from '@/components/platform/navigation-provider';
import type { PlatformNavLink } from '@/components/platform/navigation-types';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ item }: { item: PlatformNavLink }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const soon = item.status === 'soon';

  if (soon) {
    return (
      <span
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground',
          'cursor-not-allowed opacity-70'
        )}
        title="Coming soon"
      >
        <NavIcon name={item.icon} className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
        <Badge variant="outline" className="ml-auto text-[10px] font-normal">
          Soon
        </Badge>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      <NavIcon name={item.icon} className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function FeaturedButton({ item }: { item: PlatformNavLink }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const soon = item.status === 'soon';

  const className = cn(
    'flex flex-1 flex-col items-center gap-1 rounded-lg border border-border px-2 py-2 text-center text-xs transition-colors',
    active && !soon && 'border-primary/40 bg-accent text-accent-foreground',
    !soon && !active && 'hover:bg-accent/60',
    soon && 'cursor-not-allowed opacity-60'
  );

  if (soon) {
    return (
      <span className={className} title={`${item.label} (coming soon)`}>
        <NavIcon name={item.icon} className="size-5" />
        <span className="line-clamp-2 leading-tight">{item.label}</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} title={item.label}>
      <NavIcon name={item.icon} className="size-5" />
      <span className="line-clamp-2 leading-tight">{item.label}</span>
    </Link>
  );
}

export function PlatformSidebar() {
  const { nav } = useNavigation();

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-4">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mifos Web
        </p>
      </div>

      {nav.featured.length > 0 ? (
        <div className="px-3 pt-3">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Quick access
          </p>
          <div className="flex gap-2">
            {nav.featured.map((item) => (
              <FeaturedButton key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      <Separator className="my-3" />

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {nav.groups.map((group) => (
            <Collapsible key={group.id} defaultOpen={group.defaultOpen}>
              <CollapsibleTrigger
                className={cn(
                  'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide',
                  'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                <span className="flex-1 text-left">{group.label}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-0.5 space-y-0.5 pl-2">
                {group.items.map((item) => (
                  <SidebarLink key={item.id} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ExternalLink, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface DetailNavItem {
  id: string;
  label: string;
  href: string;
  /** Optional leading icon (lucide-react). */
  icon?: LucideIcon;
  /** Show external-link affordance (opens in new context / external route) */
  external?: boolean;
}

export interface DetailNavGroup {
  id: string;
  items: DetailNavItem[];
}

/**
 * Vertical secondary navigation: link list with optional groups (spacing only, no titles).
 */
export function DetailNavSidebar({
  groups,
  className
}: {
  groups: DetailNavGroup[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className={cn('flex flex-col', className)}>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <ul key={group.id} className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-normal transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                    {...(item.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {Icon ? (
                        <Icon
                          className={cn(
                            'size-4 shrink-0',
                            active ? 'text-foreground' : 'text-muted-foreground'
                          )}
                          aria-hidden
                        />
                      ) : null}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.external ? (
                      <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </nav>
  );
}

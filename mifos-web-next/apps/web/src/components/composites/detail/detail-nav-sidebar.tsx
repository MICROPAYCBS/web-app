'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface DetailNavItem {
  id: string;
  label: string;
  href: string;
  /** Show external-link affordance (opens in new context / external route) */
  external?: boolean;
}

export interface DetailNavGroup {
  id: string;
  /** Uppercase section label, e.g. "Accounts & services" */
  label: string;
  items: DetailNavItem[];
}

/**
 * Vertical secondary navigation (Supabase-style): grouped sections, muted labels,
 * rounded active row on a subtle muted background.
 */
export function DetailNavSidebar({
  title,
  groups,
  className
}: {
  title?: string;
  groups: DetailNavGroup[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className={cn('flex flex-col', className)}>
      {title ? (
        <h2 className="mb-5 px-3 text-base font-semibold tracking-tight text-foreground">{title}</h2>
      ) : null}
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                      <span className="truncate">{item.label}</span>
                      {item.external ? (
                        <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

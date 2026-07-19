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
import { cn } from '@/lib/utils';

export interface DetailNavTab {
  id: string;
  label: string;
  href: string;
}

/**
 * Horizontal tabs (legacy). Prefer DetailNavSidebar for Supabase-style vertical nav.
 */
export function DetailNavTabs({ tabs }: { tabs: DetailNavTab[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="-mx-1 border-b border-border">
      <div className="flex gap-0 overflow-x-auto px-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

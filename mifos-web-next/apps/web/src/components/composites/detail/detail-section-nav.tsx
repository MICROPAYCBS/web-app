'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DetailSectionNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Vertical section switcher (button tabs). Same visual language as DetailNavSidebar.
 */
export function DetailSectionNav({
  items,
  activeId,
  onSelect,
  className,
  footer
}: {
  items: DetailSectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <nav aria-label="Sections" className={cn('flex flex-col', className)}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-normal transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
                aria-current={active ? 'true' : undefined}
              >
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
              </button>
            </li>
          );
        })}
      </ul>
      {footer}
    </nav>
  );
}

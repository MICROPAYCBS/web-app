'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailSectionTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Horizontal secondary navigation — button tabs synced via {@link useDetailSection}.
 */
export function DetailSectionTabs({
  items,
  activeId,
  onSelect
}: {
  items: DetailSectionTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Sections" className="-mx-1 border-b border-border">
      <div className="flex gap-0 overflow-x-auto px-1">
        {items.map((item) => {
          const active = item.id === activeId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
              aria-current={active ? 'true' : undefined}
            >
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

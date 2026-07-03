'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import {
  countSelectedPermissions,
  formatRoleGroupingName
} from '@/lib/fineract/role-display';
import { cn } from '@/lib/utils';

export function PermissionGroupingSidebar({
  groups,
  selectedGrouping,
  onSelect
}: {
  groups: Array<{ grouping: string; permissions: FineractRolePermissionUsage[] }>;
  selectedGrouping: string | null;
  onSelect: (grouping: string) => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Permission categories" className="lg:w-60 lg:shrink-0">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {groups.map(({ grouping, permissions }) => {
          const assignedCount = countSelectedPermissions(permissions);
          const isSelected = selectedGrouping === grouping;

          return (
            <li key={grouping} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(grouping)}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                  'flex w-full min-w-[10rem] items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors lg:min-w-0',
                  isSelected
                    ? 'border-border bg-muted text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <span className="min-w-0 font-medium">{formatRoleGroupingName(grouping)}</span>
                <span
                  className={cn(
                    'shrink-0 tabular-nums text-xs',
                    assignedCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {assignedCount}/{permissions.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

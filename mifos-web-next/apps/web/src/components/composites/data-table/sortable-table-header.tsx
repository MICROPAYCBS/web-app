/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SortableTableHeader<T extends string>({
  label,
  column,
  activeColumn,
  sortOrder,
  onSort,
  align = 'left'
}: {
  label: string;
  column: T;
  activeColumn?: T;
  sortOrder?: 'ASC' | 'DESC';
  onSort: (column: T) => void;
  align?: 'left' | 'right';
}) {
  const isActive = activeColumn === column;
  const Icon = isActive ? (sortOrder === 'ASC' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={
        align === 'right'
          ? '-mr-3 ml-auto h-8 gap-1 font-medium'
          : '-ml-3 h-8 gap-1 font-medium'
      }
      onClick={() => onSort(column)}
    >
      {label}
      <Icon className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}

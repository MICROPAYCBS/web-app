'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { flexRender, type Table as ReactTable } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/composites/empty-state';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage = 'No results.',
  emptyDescription,
  emptyAction,
  /** Sticky column header for long list pages. Off inside detail cards so the table scrolls with its container. */
  stickyHeader = true
}: {
  table: ReactTable<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  stickyHeader?: boolean;
}) {
  const columnCount = table.getAllColumns().length;

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader
          className={cn(
            'bg-muted',
            stickyHeader && 'sticky top-0 z-[1] bg-muted'
          )}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-0">
                <EmptyState
                  variant="compact"
                  title={emptyMessage}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

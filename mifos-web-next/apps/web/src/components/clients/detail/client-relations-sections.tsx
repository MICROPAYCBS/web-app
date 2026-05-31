/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailSection } from '@/components/composites';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDatatableColumnLabel } from '@/lib/fineract/client-datatables';

export interface ClientDatatableSection {
  registeredTableName: string;
  rows: Record<string, unknown>[];
}

const HIDDEN_COLUMNS = new Set(['id', 'client_id', 'created_at', 'updated_at']);

export function ClientRelationsSections({
  sections
}: {
  sections: ClientDatatableSection[];
}) {
  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No many-to-one custom data tables are registered for clients, or this client has no related
        rows yet.
      </p>
    );
  }

  return (
    <>
      {sections.map((section) => {
        const columns = Object.keys(section.rows[0] ?? {}).filter((key) => !HIDDEN_COLUMNS.has(key));
        const title = formatDatatableColumnLabel(section.registeredTableName.replace(/_/g, ' '));

        return (
          <DetailSection key={section.registeredTableName} title={title}>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{formatDatatableColumnLabel(col)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col) => (
                        <TableCell key={col}>{formatCellValue(row[col])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DetailSection>
        );
      })}
    </>
  );
}

function formatCellValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'object') {
    const obj = value as { value?: string; name?: string };
    return obj.value ?? obj.name ?? '—';
  }
  return String(value);
}

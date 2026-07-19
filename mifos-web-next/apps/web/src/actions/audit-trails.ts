'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import type { FineractAuditTrailDetail, FineractAuditTrailListItem } from '@mifos/api-client';
import { toFineractActionError } from '@mifos/validation';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';
import type { AuditTrailListQuery } from '@/lib/fineract/audit-trail-query';
import { getAuditTrail, listAuditTrails } from '@/lib/fineract/audit-trails';
import { getServerSession } from '@/lib/session/server';

export type AuditTrailsExportResult =
  | { ok: true; filename: string; csv: string }
  | { ok: false; message: string };

export type GetAuditTrailResult =
  | { ok: true; audit: FineractAuditTrailDetail }
  | { ok: false; message: string };

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function auditTrailToCsvRow(row: FineractAuditTrailListItem): string {
  return [
    row.id,
    row.resourceId ?? '',
    row.processingResult ?? '',
    row.officeName ?? '',
    formatAuditTrailDateTime(row.madeOnDate),
    row.maker ?? '',
    formatAuditTrailDateTime(row.checkedOnDate),
    row.checker ?? '',
    row.entityName ?? '',
    row.actionName ?? '',
    row.clientName ?? ''
  ]
    .map(csvEscape)
    .join(',');
}

export async function getAuditTrailAction(auditId: number): Promise<GetAuditTrailResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_AUDIT');
  } catch {
    return { ok: false, message: 'You do not have permission to view audit trails.' };
  }

  try {
    const audit = await getAuditTrail(auditId);
    if (!audit) {
      return { ok: false, message: 'Audit entry not found.' };
    }
    return { ok: true, audit };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load audit entry.');
  }
}

export async function exportAuditTrailsCsvAction(
  query: AuditTrailListQuery
): Promise<AuditTrailsExportResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_AUDIT');
  } catch {
    return { ok: false, message: 'You do not have permission to export audit trails.' };
  }

  try {
    const page = await listAuditTrails({ ...query, offset: 0, limit: -1 });
    const header = [
      'ID',
      'Resource ID',
      'Status',
      'Office',
      'Made On',
      'Maker',
      'Checked On',
      'Checker',
      'Entity',
      'Action',
      'Customer'
    ].join(',');
    const rows = page.pageItems.map((row) => auditTrailToCsvRow(row));
    return {
      ok: true,
      filename: 'audit-trails.csv',
      csv: [header, ...rows].join('\r\n')
    };
  } catch (error) {
    return toFineractActionError(error, 'Failed to export audit trails.');
  }
}

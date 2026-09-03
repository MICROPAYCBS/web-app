import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { isMissingReportReadPermissionMessage, reportReadPermissionCode } from '@mifos/domain';
import { getFineractErrorMessage } from '@mifos/i18n';
import { createFineractClient } from '@/lib/fineract/create-client';

const PERMISSIONS_PATH = '/permissions';

function normalizePermissionCode(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const code = (raw as Record<string, unknown>).code;
  return typeof code === 'string' && code.trim() ? code.trim() : null;
}

export async function listApplicationPermissionCodes(): Promise<Set<string>> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(PERMISSIONS_PATH);
  const rows = Array.isArray(raw) ? raw : [];
  const codes = new Set<string>();
  for (const row of rows) {
    const code = normalizePermissionCode(row);
    if (code) {
      codes.add(code);
    }
  }
  return codes;
}

export function hasReportReadPermission(
  permissionCodes: Set<string>,
  reportName: string
): boolean {
  return permissionCodes.has(reportReadPermissionCode(reportName));
}

export function isMissingReportReadPermissionError(
  error: unknown,
  reportName?: string
): boolean {
  if (!(error instanceof FineractHttpError)) {
    return false;
  }
  const message = getFineractErrorMessage(error.body, error.status, {
    requestPath: error.request?.path
  }) ?? error.message;
  return isMissingReportReadPermissionMessage(message, reportName);
}

export function formatReportDeletePermissionError(reportName: string): string {
  const code = reportReadPermissionCode(reportName);
  return (
    `This report is missing its server permission record (${code}). ` +
    'That is separate from your role — ALL_FUNCTIONS does not create this row. ' +
    'An administrator must add the permission in the database, then retry delete.'
  );
}

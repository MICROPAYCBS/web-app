/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract `m_permission.code` for running/viewing a report by name. */
export function reportReadPermissionCode(reportName: string): string {
  return `READ_${reportName}`;
}

export function isMissingReportReadPermissionMessage(message: string, reportName?: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized.includes('permission with code') || !normalized.includes('does not exist')) {
    return false;
  }
  if (!reportName) {
    return normalized.includes('read_');
  }
  return normalized.includes(reportReadPermissionCode(reportName).toLowerCase());
}

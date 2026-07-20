/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatReportRunDateValue } from '@/lib/fineract/report-run-display';

export type GlAccountLedgerFilterInput = {
  startDate: string;
  endDate: string;
  officeId: string;
  currencyCode: string;
  /**
   * `undefined` / empty = omit (all departments).
   * `"0"` = unassigned only.
   */
  departmentId?: string;
};

/**
 * Builds query string params for `GET /glaccounts/{id}/ledger`.
 * Returns `null` when required filters are missing.
 */
export function buildGlAccountLedgerQueryParams(
  filters: GlAccountLedgerFilterInput
): Record<string, string> | null {
  const officeId = filters.officeId?.trim() ?? '';
  const currencyCode = filters.currencyCode?.trim().toUpperCase() ?? '';
  const startDate = formatReportRunDateValue(filters.startDate?.trim() ?? '');
  const endDate = formatReportRunDateValue(filters.endDate?.trim() ?? '');

  if (!officeId || !currencyCode || !startDate || !endDate) {
    return null;
  }
  if (!/^\d+$/.test(officeId) || Number(officeId) <= 0) {
    return null;
  }

  const params: Record<string, string> = {
    startDate,
    endDate,
    officeId,
    currencyCode
  };

  const departmentId = filters.departmentId?.trim();
  if (departmentId != null && departmentId !== '') {
    params.departmentId = departmentId;
  }

  return params;
}

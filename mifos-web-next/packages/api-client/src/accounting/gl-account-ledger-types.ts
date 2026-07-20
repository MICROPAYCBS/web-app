/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Query params for `GET /glaccounts/{glAccountId}/ledger`. */
export interface FineractGlAccountLedgerParams {
  /** Inclusive period start (`yyyy-MM-dd`). */
  startDate: string;
  /** Inclusive period end (`yyyy-MM-dd`). */
  endDate: string;
  officeId: number;
  currencyCode: string;
  /**
   * Omit = all departments aggregated.
   * `0` = unassigned only.
   */
  departmentId?: number;
}

export interface FineractGlAccountLedgerSummary {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  /** ISO-8601 UTC instant of newest matching JE; null when entries empty. */
  lastUpdated: string | null;
}

export interface FineractGlAccountLedgerEntry {
  entryDate: string;
  transactionId: string;
  description?: string | null;
  source: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

/** Response from `GET /glaccounts/{glAccountId}/ledger`. */
export interface FineractGlAccountLedgerResponse {
  glAccountId: number;
  glCode: string;
  glAccountName: string;
  officeId: number;
  officeName: string;
  /** Null when request omitted departmentId (all-dept aggregate). */
  departmentId: number | null;
  departmentName: string | null;
  currencyCode: string;
  startDate: string;
  endDate: string;
  summary: FineractGlAccountLedgerSummary;
  entries: FineractGlAccountLedgerEntry[];
}

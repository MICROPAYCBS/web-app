/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** One branch × department × GL account × currency row from `GET /glaccounts/enquiry`. */
export interface FineractGlAccountEnquiryRow {
  officeId: number;
  officeName: string;
  /** `0` when activity is not assigned to a department. */
  departmentId: number;
  /** Null/omitted when unassigned (`departmentId` is 0). */
  departmentName: string | null;
  glAccountId: number;
  glCode: string;
  glAccountName: string;
  currencyCode: string;
  balance: number;
  disabled: boolean;
}

/** Query params for advanced GL account enquiry (all optional; at least one required). */
export interface FineractGlAccountEnquiryParams {
  ledgerNumber?: string;
  officeId?: number;
  departmentId?: number;
  currencyCode?: string;
  /** `true` = disabled only; `false` = enabled only. */
  disabled?: boolean;
}

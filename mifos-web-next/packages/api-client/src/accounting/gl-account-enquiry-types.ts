/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** One branch × GL account × currency row from `GET /glaccounts/enquiry`. */
export interface FineractGlAccountEnquiryRow {
  officeId: number;
  officeName: string;
  glAccountId: number;
  glCode: string;
  glAccountName: string;
  currencyCode: string;
  balance: number;
  disabled: boolean;
}

/** Query params for advanced GL account enquiry (all optional; at least one required). */
export interface FineractGlAccountEnquiryParams {
  glPrefix?: string;
  ledgerNumber?: string;
  officeId?: number;
  currencyCode?: string;
  /** `true` = disabled only; `false` = enabled only. */
  disabled?: boolean;
}

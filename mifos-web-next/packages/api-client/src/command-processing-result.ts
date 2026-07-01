/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract {@code CommandProcessingResult} returned by command APIs (POST/PUT/DELETE). */
export interface FineractCommandProcessingResult {
  commandId?: number;
  officeId?: number;
  groupId?: number;
  clientId?: number;
  loanId?: number;
  savingsId?: number;
  resourceId?: number;
  subResourceId?: number;
  transactionId?: string;
  productId?: number;
  rollbackTransaction?: boolean;
  changes?: Record<string, unknown>;
}

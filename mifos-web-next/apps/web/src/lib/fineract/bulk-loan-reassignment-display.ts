/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkLoanReassignmentLoanSummary } from '@mifos/api-client';

export function formatBulkLoanReassignmentLoanLabel(loan: BulkLoanReassignmentLoanSummary): string {
  const product = loan.productName?.trim() || 'Loan';
  const account = loan.accountNo?.trim();
  return account ? `${product} (${account})` : product;
}

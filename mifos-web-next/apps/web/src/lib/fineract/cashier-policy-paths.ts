/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Block settle and cash outflows when amount exceeds cashier net cash. */
export const PREVENT_CASHIER_OVERDRAW_CONFIG_NAME = 'prevent-cashier-overdraw';

/** Require an active cashier session for cash payment type transactions. */
export const REQUIRE_CASHIER_FOR_CASH_TRANSACTIONS_CONFIG_NAME =
  'require-cashier-for-cash-transactions';

export interface CashierPolicySettings {
  preventCashierOverdraw: boolean;
  requireCashierForCashTransactions: boolean;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * User-facing explanations for savings product fields.
 */

/** Settings — balances */
export const SAVINGS_PRODUCT_MIN_OPENING_BALANCE_HINT =
  'Minimum deposit required to open an account on this product.';

export const SAVINGS_PRODUCT_MIN_BALANCE_FOR_INTEREST_HINT =
  'Interest is calculated only when the account balance is at least this amount.';

export const SAVINGS_PRODUCT_ENFORCE_MIN_BALANCE_HINT =
  'When enabled, the account balance cannot fall below the minimum required balance.';

export const SAVINGS_PRODUCT_MIN_REQUIRED_BALANCE_HINT =
  'Lowest balance allowed on accounts for this product when minimum balance is enforced.';

/** Settings — lock-in */
export const SAVINGS_PRODUCT_ENABLE_LOCKIN_HINT =
  'Prevents withdrawals for a set period after the account is opened.';

export const SAVINGS_PRODUCT_LOCKIN_FREQUENCY_HINT =
  'How long the lock-in lasts, combined with the period type below.';

export const SAVINGS_PRODUCT_LOCKIN_PERIOD_TYPE_HINT =
  'Unit for the lock-in frequency (days, weeks, months, or years).';

/** Settings — overdraft */
export const SAVINGS_PRODUCT_WITHDRAWAL_FEE_FOR_TRANSFERS_HINT =
  'Apply the withdrawal fee when funds are transferred between accounts.';

export const SAVINGS_PRODUCT_ALLOW_OVERDRAFT_HINT =
  'Allow accounts on this product to go negative up to the overdraft limit.';

export const SAVINGS_PRODUCT_OVERDRAFT_LIMIT_HINT =
  'Maximum negative balance allowed when overdraft is enabled.';

export const SAVINGS_PRODUCT_MIN_OVERDRAFT_FOR_INTEREST_HINT =
  'Interest on overdraft is calculated only when the overdrawn amount is at least this value.';

export const SAVINGS_PRODUCT_OVERDRAFT_INTEREST_RATE_HINT =
  'Annual interest rate charged on overdrawn balances.';

/** Settings — tax and dormancy */
export const SAVINGS_PRODUCT_WITHHOLD_TAX_HINT =
  'Deduct tax from interest when interest is posted to the account.';

export const SAVINGS_PRODUCT_TAX_GROUP_HINT =
  'Tax group that defines which taxes apply to interest postings.';

export const SAVINGS_PRODUCT_DORMANCY_TRACKING_HINT =
  'Track inactive accounts and move them through inactive, dormant, and escheat stages.';

export const SAVINGS_PRODUCT_DAYS_TO_INACTIVE_HINT =
  'Consecutive days without activity before the account is marked inactive.';

export const SAVINGS_PRODUCT_DAYS_TO_DORMANCY_HINT =
  'Consecutive days without activity before the account is marked dormant. Must be greater than days to inactive.';

export const SAVINGS_PRODUCT_DAYS_TO_ESCHEAT_HINT =
  'Consecutive days without activity before the account is marked for escheat. Must be greater than days to dormancy.';

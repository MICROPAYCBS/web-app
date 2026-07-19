/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * User-facing explanations for loan product fields.
 */

export const LOAN_PRODUCT_CURRENCY_IN_MULTIPLES_OF_HINT =
  'Loan amounts (such as principal and disbursement) are rounded to the nearest multiple of this value. For example, 100 rounds to 100, 200, 300, and so on. Use 0 for no rounding.';

export const LOAN_PRODUCT_INSTALLMENT_IN_MULTIPLES_OF_HINT =
  'Each repayment installment is rounded to the nearest multiple of this value after the schedule is calculated. For example, 50 rounds installments to 50, 100, 150, and so on. Use 0 or leave blank for no rounding.';

export const LOAN_PRODUCT_NOMINAL_INTEREST_RATE_HINT =
  'Set the minimum, default, and maximum nominal interest rate per period. The default is applied to new loans; min and max constrain what staff can enter on individual accounts.';

export const LOAN_PRODUCT_LOAN_SCHEDULE_TYPE_HINT =
  'How repayments are calculated for loans on this product. Cumulative uses the standard schedule engine. Progressive is required for advanced repayment strategies, down payments, and credit allocation features.';

export const LOAN_PRODUCT_SCHEDULE_PROCESSING_TYPE_HINT =
  'How incoming payments are applied to the schedule when using the advanced payment allocation strategy. Horizontal applies allocation rules across installment components in the usual order. Vertical uses column-wise processing and is only available with that strategy.';

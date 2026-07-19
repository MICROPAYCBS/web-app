/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** User-facing explanations for loan application fields. */

export const LOAN_ACCOUNT_PRINCIPAL_HINT =
  'The amount the customer borrows and repays over the life of the loan, before interest.';

export const LOAN_ACCOUNT_LOAN_TERM_HINT =
  'How long the loan runs in total. Pair with the unit — for example, 12 months.';

export const LOAN_ACCOUNT_LOAN_TERM_TYPE_HINT =
  'Unit for the loan term: days, weeks, months, or years.';

export const LOAN_ACCOUNT_NUMBER_OF_REPAYMENTS_HINT =
  'How many installments the customer will pay over the loan life.';

export const LOAN_ACCOUNT_REPAY_EVERY_HINT =
  'Spacing between installments. Pair with the unit — for example, every 1 month.';

export const LOAN_ACCOUNT_REPAYMENT_FREQUENCY_TYPE_HINT =
  'Unit for the repayment interval: days, weeks, months, or years.';

export const LOAN_ACCOUNT_ENABLE_DOWN_PAYMENT_HINT =
  'Keep enabled when this loan includes an upfront down payment installment in the schedule.';

export const LOAN_ACCOUNT_INTEREST_RATE_HINT =
  'Nominal interest rate applied on the outstanding balance for each charging period on this application.';

export const LOAN_ACCOUNT_EXPECTED_DISBURSEMENT_HINT =
  'Planned date to pay loan funds out to the customer.';

export const LOAN_ACCOUNT_EXPECTED_FIRST_REPAYMENT_HINT =
  'Optional. Use when the first installment should fall due on a specific date instead of the calculated schedule.';

export const LOAN_ACCOUNT_GRACE_ON_PRINCIPAL_HINT =
  'Installments at the start where principal is not due — often interest-only payments during a moratorium.';

export const LOAN_ACCOUNT_GRACE_ON_INTEREST_PAYMENT_HINT =
  'Installments at the start where interest payments are not required.';

export const LOAN_ACCOUNT_GRACE_ON_INTEREST_CHARGED_HINT =
  'Periods at the start when interest is not accrued on the outstanding balance.';

export const LOAN_ACCOUNT_AMORTIZATION_HINT =
  'How each installment splits between principal and interest — equal payments or equal principal portions.';

export const LOAN_ACCOUNT_INTEREST_TYPE_HINT =
  'Whether interest is calculated on the declining balance still owed or on the original loan amount (flat).';

export const LOAN_ACCOUNT_INTEREST_CALCULATION_PERIOD_HINT =
  'How often interest is calculated — for example daily or once per repayment period.';

export const LOAN_ACCOUNT_REPAYMENT_STRATEGY_HINT =
  'Order in which incoming payments are applied to penalties, fees, interest, and principal.';

export const LOAN_ACCOUNT_LINK_SAVINGS_HINT =
  'Savings account used to collect repayments from this loan, when account linking is enabled.';

export const LOAN_ACCOUNT_STANDING_INSTRUCTION_AT_DISBURSEMENT_HINT =
  'Automatically set up a standing instruction to transfer repayments from the linked savings account when the loan is disbursed. Requires a linked savings account.';

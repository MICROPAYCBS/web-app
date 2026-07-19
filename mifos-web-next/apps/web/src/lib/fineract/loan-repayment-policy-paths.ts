/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract global configuration: allow cash/bank/mobile direct loan repayments. */
export const ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME = 'allow-direct-loan-repayments';

/** Loan transaction commands blocked when direct repayments are disabled. */
export const DIRECT_LOAN_INBOUND_PAYMENT_COMMANDS = [
  'repayment',
  'recoverypayment',
  'downpayment'
] as const;

export type DirectLoanInboundPaymentCommand =
  (typeof DIRECT_LOAN_INBOUND_PAYMENT_COMMANDS)[number];

export type LoanInboundPaymentKind = 'repayment' | 'recoverypayment';

export type LoanInboundPaymentMethod = 'direct' | 'savings';

export type LoanRepaymentPolicySettings = {
  allowDirectLoanRepayments: boolean;
};

export const SAVINGS_ONLY_REPAYMENT_MESSAGE =
  'Link a savings account to this loan before repaying from savings.';

export function isDirectLoanInboundPaymentCommand(
  command: string
): command is DirectLoanInboundPaymentCommand {
  return (DIRECT_LOAN_INBOUND_PAYMENT_COMMANDS as readonly string[]).includes(command);
}

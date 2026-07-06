/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  LoanInboundPaymentKind,
  LoanInboundPaymentMethod,
  LoanRepaymentPolicySettings
} from '@/lib/fineract/loan-repayment-policy-paths';
import { loanAccountCanRepayFromSavings } from '@/lib/fineract/loan-account-repayment-transfer';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

export function resolveLoanInboundPaymentMethods(input: {
  allowDirectLoanRepayments: boolean;
  canDirect: boolean;
  canTransfer: boolean;
}): {
  methods: LoanInboundPaymentMethod[];
  defaultMethod: LoanInboundPaymentMethod | null;
} {
  const showDirect = input.allowDirectLoanRepayments && input.canDirect;
  const showTransfer = input.canTransfer;

  if (!showDirect && !showTransfer) {
    return { methods: [], defaultMethod: null };
  }

  const methods: LoanInboundPaymentMethod[] = [];
  if (showDirect) {
    methods.push('direct');
  }
  if (showTransfer) {
    methods.push('savings');
  }

  let defaultMethod: LoanInboundPaymentMethod;
  if (showDirect && showTransfer) {
    defaultMethod = 'direct';
  } else if (showDirect) {
    defaultMethod = 'direct';
  } else {
    defaultMethod = 'savings';
  }

  return { methods, defaultMethod };
}

export function loanInboundPaymentEligibility(input: {
  account: FineractLoanAccountDetail;
  kind: LoanInboundPaymentKind;
  policy: LoanRepaymentPolicySettings;
  permissions: {
    makeRepayment: boolean;
    recoveryPayment: boolean;
    repayFromSavings: boolean;
  };
  statusVisible: boolean;
}): {
  show: boolean;
  canDirect: boolean;
  canTransfer: boolean;
  hasLinkedSavings: boolean;
} {
  const hasLinkedSavings = loanAccountCanRepayFromSavings(input.account);
  const canDirect =
    input.kind === 'repayment'
      ? input.permissions.makeRepayment
      : input.permissions.recoveryPayment;
  const canTransfer = input.permissions.repayFromSavings && hasLinkedSavings;
  const { methods } = resolveLoanInboundPaymentMethods({
    allowDirectLoanRepayments: input.policy.allowDirectLoanRepayments,
    canDirect,
    canTransfer
  });

  const show =
    input.statusVisible &&
    (methods.length > 0 ||
      (!input.policy.allowDirectLoanRepayments && input.permissions.repayFromSavings));

  return {
    show,
    canDirect,
    canTransfer,
    hasLinkedSavings
  };
}

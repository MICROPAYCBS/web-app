/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type DepositAccountingProduct = 'savings' | 'fixed' | 'recurring';

export interface DepositAccountingRuleGuidance {
  title: string;
  points: string[];
}

const NONE = 1;
const CASH = 2;
const ACCRUAL_PERIODIC = 3;

const CASH_BY_PRODUCT: Record<DepositAccountingProduct, string[]> = {
  savings: [
    "A deposit debits the saving reference account, or the mapped payment channel's debit account, and credits saving control. A withdrawal reverses that.",
    'Interest expense is booked on the posting date, when interest is added to the account. Until that date, earned interest stays off the ledger.',
    'Fees and penalties become income when they are taken from the account.',
    'When overdraft is on, the overdrawn amount debits the overdraft portfolio, and overdraft interest is income when it is charged. Writing off an overdraft debits losses written off.',
    'When dormancy tracking is on, escheat moves the balance from customer deposits to the escheat liability.'
  ],
  fixed: [
    "The opening deposit debits the saving reference account, or the mapped payment channel's debit account, and credits saving control. That credit is the institution's liability to the client.",
    'Interest expense is booked when interest is posted, on the posting cycle or at maturity. Until then, earned interest stays off the ledger.',
    'Fees become income when they are taken from the deposit. On pre-closure, only the reduced interest is posted, and the penalty is income.',
    'Maturity payout or transfer debits saving control for principal plus posted interest.',
    'Withholding tax reduces saving control and credits the tax account.'
  ],
  recurring: [
    "Each installment received debits the saving reference account, or the mapped payment channel's debit account, and credits saving control.",
    'A missed installment stays an arrear on the account. The ledger updates when the money arrives.',
    'Interest expense is booked when interest is posted. Until that date, earned interest stays off the ledger.',
    'A partial withdrawal, a pre-closure penalty, and the maturity payout debit saving control for the amount that leaves the deposit.',
    'Withholding tax reduces saving control and credits the tax account.'
  ]
};

const ACCRUAL_BY_PRODUCT: Record<DepositAccountingProduct, string[]> = {
  savings: [
    'Deposits, withdrawals, transfers, collected fees, and tax use the same entries as cash.',
    'Interest you owe the customer is recognized before it is added to the balance. Accrual debits interest expense and credits interest payable. Posting later moves interest payable onto the account. The expense was already recognized at accrual.',
    'When overdraft is on, interest the customer owes accrues to interest receivable and income from interest before it is collected.',
    'Map interest payable, fees receivable, and penalties receivable. Fees and penalties can sit in those receivable accounts until they are collected.',
    'The accrual job has to run. Otherwise interest expense waits until the posting date, and posting still expects a balance in interest payable.'
  ],
  fixed: [
    'The opening deposit, fees, payout, transfer, and tax use the same entries as cash.',
    'Interest expense is recognized during the term, before it is added to the deposit. Accrual debits interest expense and credits interest payable. Posting later moves interest payable onto the account.',
    'On pre-closure, interest already accrued above the penalty rate is adjusted so interest payable matches the amount you will credit. The penalty is income.',
    'Map interest payable, fees receivable, and penalties receivable.',
    'The accrual job has to run. Otherwise interest expense waits until posting, and posting still expects a balance in interest payable.'
  ],
  recurring: [
    'Installment deposits, withdrawals, fees, payout, and tax use the same entries as cash.',
    'Interest expense is recognized between posting dates, on deposits already received. Accrual debits interest expense and credits interest payable. A scheduled installment that has not arrived yet stays off the accrual.',
    'Posting moves interest payable onto the account. On pre-closure, interest payable is brought in line with the penalty rate before the payout.',
    'Map interest payable, fees receivable, and penalties receivable.',
    'The accrual job has to run. Otherwise interest expense waits until posting, and posting still expects a balance in interest payable.'
  ]
};

const NONE_BY_PRODUCT: Record<DepositAccountingProduct, string[]> = {
  savings: [
    'Deposits, withdrawals, fees, interest posting, and escheat still update the account balance.',
    'Those events leave the general ledger unchanged. The accrual job skips these accounts.'
  ],
  fixed: [
    'The opening deposit, interest posting, fees, pre-closure, maturity payout, and tax still update the deposit balance.',
    'Those events leave the general ledger unchanged. The accrual job skips these accounts.'
  ],
  recurring: [
    'Each installment, interest posting, fee, withdrawal, pre-closure, maturity payout, and tax still update the deposit balance.',
    'Those events leave the general ledger unchanged. A missed installment stays an arrear on the account. The accrual job skips these accounts.'
  ]
};

/** What the selected accounting rule posts for a savings, fixed, or recurring deposit product. */
export function depositAccountingRuleGuidance(
  product: DepositAccountingProduct,
  ruleId: number | undefined
): DepositAccountingRuleGuidance | null {
  if (ruleId === NONE) {
    return {
      title: 'No ledger posting',
      points: NONE_BY_PRODUCT[product]
    };
  }
  if (ruleId === CASH) {
    return {
      title: 'Cash — the ledger moves with the customer balance',
      points: CASH_BY_PRODUCT[product]
    };
  }
  if (ruleId === ACCRUAL_PERIODIC) {
    return {
      title: 'Periodic accrual — interest hits the ledger before it is paid out',
      points: ACCRUAL_BY_PRODUCT[product]
    };
  }
  return null;
}

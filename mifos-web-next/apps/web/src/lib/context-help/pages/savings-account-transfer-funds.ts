/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ContextHelpContent } from '@/lib/context-help/types';

export const savingsAccountTransferFundsHelp: ContextHelpContent = {
  title: 'Transfer funds',
  summary:
    'Move money from this savings account to another customer’s savings account within your organization. Search for the beneficiary, choose their account, then enter the amount and date.',
  sections: [
    {
      id: 'transfer-from',
      title: 'Transfer from',
      body: [
        'Shows the source account for this transfer—the savings account you opened from the customer profile.',
        'Available balance is the amount you can send today. The transfer cannot exceed this balance.'
      ]
    },
    {
      id: 'beneficiary-search',
      title: 'Search customer',
      body: [
        'Type at least two characters of the beneficiary’s name or account number to find customers across all branches.',
        'Results appear in the Beneficiary list below. This search covers active customers in your organization.'
      ]
    },
    {
      id: 'beneficiary',
      title: 'Beneficiary',
      body: [
        'Select the customer who will receive the funds. Their branch is determined automatically from their profile—you do not need to pick a branch.',
        'Only internal transfers between savings accounts are supported at this time.'
      ]
    },
    {
      id: 'destination-account',
      title: 'To savings account',
      body: [
        'Choose which of the beneficiary’s savings accounts should receive the money.',
        'The source account is excluded from this list. You cannot transfer to the same account.'
      ]
    },
    {
      id: 'transfer-date',
      title: 'Transfer date',
      body: [
        'The business date when the transfer is recorded. Usually this is today.',
        'Backdated transfers may be allowed depending on your organization’s settings.'
      ]
    },
    {
      id: 'transfer-amount',
      title: 'Amount',
      body: [
        'Enter how much to move in the account currency. The amount must be greater than zero and cannot exceed the available balance on the source account.',
        'Both accounts should use compatible currencies for the transfer to succeed.'
      ]
    },
    {
      id: 'transfer-description',
      title: 'Description',
      body: [
        'A short note explaining the purpose of the transfer. This appears on the transaction history for both accounts.',
        'Use clear wording your team and the customer will recognize later—for example “Repayment” or “Family support”.'
      ]
    }
  ]
};

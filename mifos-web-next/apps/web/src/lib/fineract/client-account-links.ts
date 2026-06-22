/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Legacy URL segments under `/clients/{clientId}/…` (openMF web-app). */
export const CLIENT_ACCOUNT_SEGMENTS = {
  loan: 'loans-accounts',
  savings: 'savings-accounts',
  fixedDeposit: 'fixed-deposits-accounts',
  recurringDeposit: 'recurring-deposits-accounts',
  share: 'shares-accounts'
} as const;

export type ClientAccountProductKind = keyof typeof CLIENT_ACCOUNT_SEGMENTS;

export function clientAccountGeneralPath(
  clientId: string | number,
  kind: ClientAccountProductKind,
  accountId: string | number
): string {
  const segment = CLIENT_ACCOUNT_SEGMENTS[kind];
  return `/clients/${clientId}/${segment}/${accountId}/general`;
}

export function savingsAccountSectionPath(
  clientId: string | number,
  accountId: string | number,
  section: 'summary' | 'transactions' | 'charges' = 'summary'
): string {
  const base = clientAccountGeneralPath(clientId, 'savings', accountId);
  return section === 'summary' ? base : `${base}?section=${section}`;
}

export function savingsAccountTransactionPath(
  clientId: string | number,
  accountId: string | number,
  transactionId: string | number
): string {
  return `/clients/${clientId}/${CLIENT_ACCOUNT_SEGMENTS.savings}/${accountId}/transactions/${transactionId}`;
}

export function savingsAccountTransactionSectionPath(
  clientId: string | number,
  accountId: string | number,
  transactionId: string | number,
  section: 'details' | 'journal' | 'audit'
): string {
  const base = savingsAccountTransactionPath(clientId, accountId, transactionId);
  return section === 'details' ? base : `${base}?section=${section}`;
}

export function savingsAccountTransactionReceiptPath(
  clientId: string,
  accountId: string | number,
  transactionId: string | number
): string {
  return `/api/clients/${clientId}/savings-accounts/${accountId}/transactions/${transactionId}/receipt`;
}

export function clientAccountListPath(
  clientId: string | number,
  kind: ClientAccountProductKind
): string {
  switch (kind) {
    case 'loan':
      return `/clients/${clientId}/loans`;
    case 'savings':
      return `/clients/${clientId}/savings`;
    case 'fixedDeposit':
      return `/clients/${clientId}/fixed-deposits`;
    case 'recurringDeposit':
      return `/clients/${clientId}/recurring-deposits`;
    case 'share':
      return `/clients/${clientId}/shares`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function isClientAccountSegment(
  segment: string
): segment is (typeof CLIENT_ACCOUNT_SEGMENTS)[ClientAccountProductKind] {
  return Object.values(CLIENT_ACCOUNT_SEGMENTS).includes(
    segment as (typeof CLIENT_ACCOUNT_SEGMENTS)[ClientAccountProductKind]
  );
}

export function productKindFromAccountSegment(
  segment: (typeof CLIENT_ACCOUNT_SEGMENTS)[ClientAccountProductKind]
): ClientAccountProductKind {
  const entry = Object.entries(CLIENT_ACCOUNT_SEGMENTS).find(([, value]) => value === segment);
  return (entry?.[0] ?? 'loan') as ClientAccountProductKind;
}

/** Legacy application URLs under the client detail route. */
export function clientAccountCreatePath(
  clientId: string | number,
  kind: ClientAccountProductKind
): string {
  const id = String(clientId);
  switch (kind) {
    case 'loan':
      return `/clients/${id}/${CLIENT_ACCOUNT_SEGMENTS.loan}/create`;
    case 'savings':
      return `/clients/${id}/${CLIENT_ACCOUNT_SEGMENTS.savings}/create`;
    case 'share':
      return `/clients/${id}/${CLIENT_ACCOUNT_SEGMENTS.share}/create`;
    case 'fixedDeposit':
      return `/clients/${id}/${CLIENT_ACCOUNT_SEGMENTS.fixedDeposit}/create`;
    case 'recurringDeposit':
      return `/clients/${id}/${CLIENT_ACCOUNT_SEGMENTS.recurringDeposit}/create-recurring-deposits-account`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

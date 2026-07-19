'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractJournalEntryListItem } from '@mifos/api-client';
import { BookOpen, ClipboardList, ScrollText } from 'lucide-react';
import { useMemo } from 'react';
import { LoanTransactionAuditSection } from '@/components/clients/loan-account/loan-transaction-audit-section';
import { LoanTransactionJournalSection } from '@/components/clients/loan-account/loan-transaction-journal-section';
import {
  LoanTransactionRecordTimestamps
} from '@/components/clients/loan-account/loan-transaction-record-timestamps';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
  DetailSectionNav,
  MoneyValue
} from '@/components/composites';
import { PaymentDetailSummary } from '@/components/composites/payment-detail-summary';
import { useDetailSection } from '@/hooks/use-detail-section';
import { loanAccountSectionPath } from '@/lib/fineract/client-account-links';
import type {
  FineractLoanAccountDetail,
  FineractLoanAccountTransaction
} from '@/lib/fineract/loan-account-types';
import {
  formatLoanAccountDate,
  formatLoanTransactionType,
  isLoanTransactionAccrual,
  loanAccountCurrencyCode,
  loanAccountProductName,
  loanTransactionCurrencyCode,
  loanTransactionDate,
  loanTransactionHasRecordTimestamps,
  loanTransactionRowClassName
} from '@/lib/fineract/loan-account-display';
import { cn } from '@/lib/utils';

const TRANSACTION_SECTION = {
  details: 'details',
  journal: 'journal',
  audit: 'audit'
} as const;

type TransactionSectionId = (typeof TRANSACTION_SECTION)[keyof typeof TRANSACTION_SECTION];

const DEFAULT_TRANSACTION_SECTION: TransactionSectionId = TRANSACTION_SECTION.details;

export function LoanAccountTransactionDetailView({
  account,
  transaction,
  clientId,
  canViewJournal = false,
  journalTransactionId,
  journalEntries = [],
  journalLoadFailed = false,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false
}: {
  account: FineractLoanAccountDetail;
  transaction: FineractLoanAccountTransaction;
  clientId: string;
  canViewJournal?: boolean;
  journalTransactionId?: string;
  journalEntries?: FineractJournalEntryListItem[];
  journalLoadFailed?: boolean;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
}) {
  const sectionIds = useMemo(() => {
    const ids: TransactionSectionId[] = [TRANSACTION_SECTION.details];
    if (canViewJournal) {
      ids.push(TRANSACTION_SECTION.journal);
    }
    if (canViewAudits) {
      ids.push(TRANSACTION_SECTION.audit);
    }
    return ids;
  }, [canViewAudits, canViewJournal]);

  const navItems = useMemo(
    () =>
      [
        {
          id: TRANSACTION_SECTION.details,
          label: 'Details',
          icon: ClipboardList
        },
        canViewJournal
          ? {
              id: TRANSACTION_SECTION.journal,
              label: 'Journal entries',
              icon: BookOpen
            }
          : null,
        canViewAudits
          ? {
              id: TRANSACTION_SECTION.audit,
              label: 'Audit',
              icon: ScrollText
            }
          : null
      ].filter((item): item is NonNullable<typeof item> => item !== null),
    [canViewAudits, canViewJournal]
  );

  const { activeSection, setSection } = useDetailSection(sectionIds, DEFAULT_TRANSACTION_SECTION);

  const currency =
    loanTransactionCurrencyCode(transaction, account) ?? loanAccountCurrencyCode(account);
  const rowClass = loanTransactionRowClassName(transaction);

  const status = transaction.reversed
    ? { label: 'Reversed', variant: 'outline' as const }
    : isLoanTransactionAccrual(transaction)
      ? { label: 'Accrual', variant: 'outline' as const }
      : { label: 'Posted', variant: 'secondary' as const };

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={loanAccountSectionPath(clientId, account.id, 'transactions')}
              label="Back to transactions"
            />
          }
          title={formatLoanTransactionType(transaction)}
          status={status}
          meta={
            <p className="tabular-nums text-muted-foreground">
              {loanAccountProductName(account)} · Account no. {account.accountNo}
            </p>
          }
          actions={
            canViewJournal && journalTransactionId ? (
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setSection(TRANSACTION_SECTION.journal)}
              >
                View ledger entries
              </button>
            ) : undefined
          }
        />
      }
      sidebar={
        navItems.length > 1 ? (
          <DetailSectionNav
            items={navItems}
            activeId={activeSection}
            onSelect={setSection}
          />
        ) : undefined
      }
    >
      <div className={cn(rowClass)}>
        {activeSection === TRANSACTION_SECTION.details ? (
          <div className="space-y-6">
            <DetailSection title="Transaction">
              <DetailFieldGrid>
                <DetailField label="Id">{transaction.id}</DetailField>
                <DetailField label="Type">{formatLoanTransactionType(transaction)}</DetailField>
                <DetailField label="Transaction date">
                  {formatLoanAccountDate(loanTransactionDate(transaction))}
                </DetailField>
                {transaction.officeName ? (
                  <DetailField label="Office">{transaction.officeName}</DetailField>
                ) : null}
                {transaction.externalId?.trim() ? (
                  <DetailField label="External ID">{transaction.externalId}</DetailField>
                ) : null}
                <DetailField label="Currency">
                  {transaction.currency?.name ?? currency}
                </DetailField>
                <DetailField label="Amount">
                  <MoneyValue amount={transaction.amount} currencyCode={currency} emphasize />
                </DetailField>
                {transaction.outstandingLoanBalance !== undefined ? (
                  <DetailField label="Outstanding balance">
                    <MoneyValue
                      amount={transaction.outstandingLoanBalance}
                      currencyCode={currency}
                    />
                  </DetailField>
                ) : null}
                {transaction.note?.trim() ? (
                  <DetailField label="Note">{transaction.note}</DetailField>
                ) : null}
              </DetailFieldGrid>
            </DetailSection>

            {loanTransactionHasRecordTimestamps(transaction) ? (
              <DetailSection title="Record timestamps">
                <LoanTransactionRecordTimestamps transaction={transaction} />
              </DetailSection>
            ) : null}

            {transaction.paymentDetailData ? (
              <PaymentDetailSummary payment={transaction.paymentDetailData} />
            ) : null}
          </div>
        ) : null}

        {activeSection === TRANSACTION_SECTION.journal && canViewJournal && journalTransactionId ? (
          <LoanTransactionJournalSection
            journalTransactionId={journalTransactionId}
            entries={journalEntries}
            loadFailed={journalLoadFailed}
          />
        ) : null}

        {activeSection === TRANSACTION_SECTION.audit && canViewAudits ? (
          <LoanTransactionAuditSection audits={auditEntries} loadFailed={auditLoadFailed} />
        ) : null}
      </div>
    </DetailPage>
  );
}

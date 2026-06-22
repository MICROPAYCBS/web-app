'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAuditTrailListItem,
  FineractJournalEntryListItem,
  FineractSavingsAccountDetail,
  FineractSavingsAccountTransaction
} from '@mifos/api-client';
import { BookOpen, ClipboardList, ScrollText } from 'lucide-react';
import { useMemo } from 'react';
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
import { SavingsTransactionActionsMenu } from '@/components/clients/savings/actions/savings-transaction-actions-menu';
import { PaymentDetailSummary } from '@/components/composites/payment-detail-summary';
import { SavingsTransactionAuditSection } from '@/components/clients/savings/savings-transaction-audit-section';
import { SavingsTransactionJournalSection } from '@/components/clients/savings/savings-transaction-journal-section';
import { SavingsTransactionRecordTimestamps, savingsTransactionHasRecordTimestamps } from '@/components/clients/savings/savings-transaction-record-timestamps';
import { useDetailSection } from '@/hooks/use-detail-section';
import { savingsAccountSectionPath } from '@/lib/fineract/client-account-links';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';
import {
  formatSavingsAccountDate,
  formatSavingsTransactionType,
  isSavingsTransactionAccrual,
  isSavingsTransactionDebit,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsTransactionCurrencyCode,
  savingsTransactionDate,
  savingsTransactionRowClassName
} from '@/lib/fineract/savings-account-display';
import { cn } from '@/lib/utils';

const TRANSACTION_SECTION = {
  details: 'details',
  journal: 'journal',
  audit: 'audit'
} as const;

type TransactionSectionId = (typeof TRANSACTION_SECTION)[keyof typeof TRANSACTION_SECTION];

const DEFAULT_TRANSACTION_SECTION: TransactionSectionId = TRANSACTION_SECTION.details;

export function SavingsAccountTransactionDetailView({
  account,
  transaction,
  clientId,
  canViewJournal = false,
  journalTransactionId,
  journalEntries = [],
  journalLoadFailed = false,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  transactionActionPermissions = {
    undoTransaction: false,
    undoTransfer: false,
    modifyTransaction: false,
    viewJournal: false
  }
}: {
  account: FineractSavingsAccountDetail;
  transaction: FineractSavingsAccountTransaction;
  clientId: string;
  canViewJournal?: boolean;
  journalTransactionId?: string;
  journalEntries?: FineractJournalEntryListItem[];
  journalLoadFailed?: boolean;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  transactionActionPermissions?: SavingsTransactionActionPermissions;
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

  const currency = savingsTransactionCurrencyCode(transaction, account);
  const debit = isSavingsTransactionDebit(transaction);
  const rowClass = savingsTransactionRowClassName(transaction);

  const status = transaction.reversed
    ? { label: 'Reversed', variant: 'outline' as const }
    : transaction.transfer
      ? { label: 'Transfer', variant: 'secondary' as const }
      : isSavingsTransactionAccrual(transaction)
        ? { label: 'Accrual', variant: 'outline' as const }
        : { label: 'Posted', variant: 'secondary' as const };

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={savingsAccountSectionPath(clientId, account.id, 'transactions')}
              label="Back to transactions"
            />
          }
          title={formatSavingsTransactionType(transaction)}
          status={status}
          meta={
            <p className="tabular-nums text-muted-foreground">
              {savingsAccountProductName(account)} · Account no. {account.accountNo}
            </p>
          }
          actions={
            <SavingsTransactionActionsMenu
              clientId={clientId}
              accountId={account.id}
              transaction={transaction}
              currencyCode={savingsTransactionCurrencyCode(transaction) ?? savingsAccountCurrencyCode(account)}
              permissions={{
                ...transactionActionPermissions,
                viewJournal: transactionActionPermissions.viewJournal && canViewJournal
              }}
              onViewJournal={
                canViewJournal && journalTransactionId
                  ? () => setSection(TRANSACTION_SECTION.journal)
                  : undefined
              }
            />
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
                <DetailField label="Type">{formatSavingsTransactionType(transaction)}</DetailField>
                <DetailField label="Transaction date">
                  {formatSavingsAccountDate(savingsTransactionDate(transaction))}
                </DetailField>
                {transaction.externalId?.trim() ? (
                  <DetailField label="External ID">{transaction.externalId}</DetailField>
                ) : null}
                <DetailField label="Currency">
                  {transaction.currency?.name ?? currency}
                </DetailField>
                <DetailField label="Debit">
                  {debit ? (
                    <MoneyValue amount={transaction.amount} currencyCode={currency} emphasize />
                  ) : (
                    '—'
                  )}
                </DetailField>
                <DetailField label="Credit">
                  {!debit ? (
                    <MoneyValue amount={transaction.amount} currencyCode={currency} emphasize />
                  ) : (
                    '—'
                  )}
                </DetailField>
                {transaction.runningBalance !== undefined ? (
                  <DetailField label="Balance after">
                    <MoneyValue amount={transaction.runningBalance} currencyCode={currency} />
                  </DetailField>
                ) : null}
                {transaction.note?.trim() ? (
                  <DetailField label="Note">{transaction.note}</DetailField>
                ) : null}
              </DetailFieldGrid>
            </DetailSection>

            {savingsTransactionHasRecordTimestamps(transaction) ? (
              <DetailSection title="Record timestamps">
                <SavingsTransactionRecordTimestamps transaction={transaction} />
              </DetailSection>
            ) : null}

            {transaction.transfer ? (
              <DetailSection title="Transfer">
                <DetailFieldGrid>
                  {transaction.transfer.id !== undefined ? (
                    <DetailField label="Transfer ID">{transaction.transfer.id}</DetailField>
                  ) : null}
                  {transaction.transfer.transferDescription ? (
                    <DetailField label="Description">
                      {transaction.transfer.transferDescription}
                    </DetailField>
                  ) : null}
                </DetailFieldGrid>
              </DetailSection>
            ) : null}

            {transaction.paymentDetailData ? (
              <PaymentDetailSummary payment={transaction.paymentDetailData} />
            ) : null}
          </div>
        ) : null}

        {activeSection === TRANSACTION_SECTION.journal && canViewJournal && journalTransactionId ? (
          <SavingsTransactionJournalSection
            journalTransactionId={journalTransactionId}
            entries={journalEntries}
            loadFailed={journalLoadFailed}
          />
        ) : null}

        {activeSection === TRANSACTION_SECTION.audit && canViewAudits ? (
          <SavingsTransactionAuditSection audits={auditEntries} loadFailed={auditLoadFailed} />
        ) : null}
      </div>
    </DetailPage>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import { AlertTriangle, ArrowRightLeft, FileText, PiggyBank, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  DetailSectionNav,
  MoneyValue
} from '@/components/composites';
import {
  SavingsAccountActions,
  type SavingsAccountActionPermissions
} from '@/components/clients/savings/actions/savings-account-actions';
import { SavingsAccountSectionPanel } from '@/components/clients/savings/savings-account-section-panels';
import { useDetailSection } from '@/hooks/use-detail-section';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import {
  SAVINGS_ACCOUNT_DEFAULT_SECTION,
  SAVINGS_ACCOUNT_SECTIONS,
  savingsAccountBlockedMessage,
  savingsAccountClientBackLabel,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsAccountStatusVariant,
  type SavingsAccountSectionId
} from '@/lib/fineract/savings-account-display';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';

const SECTION_ICONS: Record<SavingsAccountSectionId, LucideIcon> = {
  summary: PiggyBank,
  transactions: ArrowRightLeft,
  statement: FileText,
  charges: Receipt
};

export function SavingsAccountDetailView({
  account,
  clientId,
  permissions,
  transactionActionPermissions = {
    undoTransaction: false,
    undoTransfer: false,
    modifyTransaction: false,
    viewJournal: false
  }
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  permissions: SavingsAccountActionPermissions;
  transactionActionPermissions?: SavingsTransactionActionPermissions;
}) {
  const sectionIds = SAVINGS_ACCOUNT_SECTIONS.map((section) => section.id);
  const navItems = SAVINGS_ACCOUNT_SECTIONS.map((section) => ({
    ...section,
    icon: SECTION_ICONS[section.id]
  }));
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    SAVINGS_ACCOUNT_DEFAULT_SECTION
  );

  const currency = savingsAccountCurrencyCode(account);
  const blockedMessage = savingsAccountBlockedMessage(account);
  const onHold = account.onHoldFunds ?? account.savingsAmountOnHold ?? 0;

  return (
    <DetailPage
      className="min-h-0 flex-1"
      header={
        <div className="space-y-4">
          {blockedMessage ? (
            <div
              className="flex items-start gap-3 rounded-md border border-border bg-muted/50 px-4 py-3"
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Account action restricted</p>
                <p className="text-muted-foreground">{blockedMessage}</p>
              </div>
            </div>
          ) : null}

          <DetailHeader
            backLink={
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
                <DetailBackLink
                  href={clientGeneralPath(clientId)}
                  label={savingsAccountClientBackLabel(account)}
                />
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <Link
                  href={clientAccountListPath(clientId, 'savings')}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Savings accounts
                </Link>
              </div>
            }
            title={savingsAccountProductName(account)}
            status={{
              label: account.status.value ?? 'Unknown',
              variant: savingsAccountStatusVariant(account.status.code)
            }}
            actions={
              <SavingsAccountActions
                account={account}
                clientId={clientId}
                permissions={permissions}
              />
            }
            meta={
              <div className="space-y-1">
                <p className="tabular-nums">Account no. {account.accountNo}</p>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Available balance
                  </span>
                  <MoneyValue
                    amount={account.summary?.availableBalance}
                    currencyCode={currency}
                    emphasize
                    className="text-base"
                  />
                </div>
                {onHold > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    <MoneyValue
                      amount={account.summary?.accountBalance}
                      currencyCode={currency}
                    />{' '}
                    total ·{' '}
                    <MoneyValue amount={onHold} currencyCode={currency} /> on hold
                  </p>
                ) : null}
              </div>
            }
          />
        </div>
      }
      sidebar={
        <DetailSectionNav
          items={navItems}
          activeId={activeSection}
          onSelect={(id) => setSection(id)}
        />
      }
    >
      <SavingsAccountSectionPanel
        section={activeSection as SavingsAccountSectionId}
        account={account}
        clientId={clientId}
        transactionActionPermissions={transactionActionPermissions}
      />
    </DetailPage>
  );
}

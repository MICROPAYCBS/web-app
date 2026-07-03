'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Landmark, Wallet, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { AccountCashierPanel } from '@/components/accounts/account-cashier-panel';
import {
  LoanAccountFieldOfficerActions,
  type LoanAccountFieldOfficerPermissions
} from '@/components/clients/loan-account/actions/loan-account-field-officer-actions';
import {
  DetailBackLink,
  DetailField,
  DetailHeader,
  DetailPage,
  DetailSection,
  DetailSectionNav
} from '@/components/composites';
import { useDetailSection } from '@/hooks/use-detail-section';
import type { AccountCashierSnapshot } from '@/lib/fineract/cashier-display';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-accounts';

const LOAN_ACCOUNT_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'cashier', label: 'My cashier' }
] as const;

type LoanAccountSectionId = (typeof LOAN_ACCOUNT_SECTIONS)[number]['id'];

const LOAN_ACCOUNT_DEFAULT_SECTION: LoanAccountSectionId = 'summary';

const SECTION_ICONS: Record<LoanAccountSectionId, LucideIcon> = {
  summary: Landmark,
  cashier: Wallet
};

function loanProductName(account: FineractLoanAccountDetail) {
  return account.productName ?? account.loanProductName ?? `Loan account #${account.id}`;
}

function LoanAccountSummarySection({ account }: { account: FineractLoanAccountDetail }) {
  return (
    <DetailSection title="Summary">
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Account number">{account.accountNo}</DetailField>
        <DetailField label="Status">{account.status.value}</DetailField>
        <DetailField label="Loan officer">{account.loanOfficerName ?? '—'}</DetailField>
        <DetailField label="Currency">{account.currency.code ?? '—'}</DetailField>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Additional loan details, schedule, and transactions will be added in a future update.
      </p>
    </DetailSection>
  );
}

export function LoanAccountDetailView({
  account,
  clientId,
  permissions,
  cashierSnapshot = null
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  permissions: LoanAccountFieldOfficerPermissions;
  cashierSnapshot?: AccountCashierSnapshot | null;
}) {
  const sectionIds = useMemo(() => {
    return LOAN_ACCOUNT_SECTIONS.map((section) => section.id).filter((id) => {
      if (id === 'cashier' && !cashierSnapshot) {
        return false;
      }
      return true;
    });
  }, [cashierSnapshot]);

  const navItems = useMemo(
    () =>
      LOAN_ACCOUNT_SECTIONS.filter((section) => {
        if (section.id === 'cashier' && !cashierSnapshot) {
          return false;
        }
        return true;
      }).map((section) => ({
        ...section,
        icon: SECTION_ICONS[section.id]
      })),
    [cashierSnapshot]
  );

  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    LOAN_ACCOUNT_DEFAULT_SECTION
  );

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              <DetailBackLink href={clientGeneralPath(clientId)} label="Back to customer" />
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <DetailBackLink href={clientAccountListPath(clientId, 'loan')} label="Loans" />
            </div>
          }
          title={loanProductName(account)}
          status={{ label: account.status.value ?? 'Unknown' }}
          meta={<p>Loan account · {account.accountNo}</p>}
          actions={
            <LoanAccountFieldOfficerActions
              account={account}
              clientId={clientId}
              permissions={permissions}
            />
          }
        />
      }
      sidebar={
        navItems.length > 1 ? (
          <DetailSectionNav
            items={navItems}
            activeId={activeSection}
            onSelect={(id) => setSection(id)}
          />
        ) : undefined
      }
    >
      {activeSection === 'summary' ? <LoanAccountSummarySection account={account} /> : null}
      {activeSection === 'cashier' && cashierSnapshot ? (
        <AccountCashierPanel snapshot={cashierSnapshot} />
      ) : null}
    </DetailPage>
  );
}

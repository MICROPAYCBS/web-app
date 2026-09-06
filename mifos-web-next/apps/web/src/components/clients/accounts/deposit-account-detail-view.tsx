'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, FineractSavingsAccountDetail } from '@mifos/api-client';
import { ArrowRightLeft, PiggyBank, Receipt, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  DetailSectionNav
} from '@/components/composites';
import {
  AccountOfficerActions,
  type AccountOfficerPermissions
} from '@/components/clients/accounts/actions/account-officer-actions';
import {
  DepositAccountActions,
  type DepositAccountActionPermissions
} from '@/components/clients/accounts/actions/deposit-account-actions';
import { AccountCustomerMeta } from '@/components/clients/accounts/account-customer-meta';
import { AccountOfficerMeta } from '@/components/clients/accounts/account-officer-meta';
import { AccountExternalIdMeta } from '@/components/clients/accounts/account-external-id-meta';
import { DepositAccountSectionPanel } from '@/components/clients/accounts/deposit-account-section-panels';
import { useDetailSection } from '@/hooks/use-detail-section';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import {
  clientAccountListPath,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import {
  DEPOSIT_ACCOUNT_DEFAULT_SECTION,
  DEPOSIT_ACCOUNT_SECTIONS,
  isTermDepositAccountKind,
  type DepositAccountSectionId,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import type { DepositTransactionActionPermissions } from '@/lib/fineract/deposit-transaction-actions';
import {
  savingsAccountClientBackLabel,
  savingsAccountProductName
} from '@/lib/fineract/savings-account-display';

const KIND_LABELS: Record<ClientDepositAccountKind, string> = {
  savings: 'Savings account',
  fixedDeposit: 'Fixed deposit account',
  recurringDeposit: 'Recurring deposit account'
};

const LIST_LABELS: Record<ClientDepositAccountKind, string> = {
  savings: 'Savings accounts',
  fixedDeposit: 'Fixed deposits',
  recurringDeposit: 'Recurring deposits'
};

const LIST_KIND: Record<ClientDepositAccountKind, ClientAccountProductKind> = {
  savings: 'savings',
  fixedDeposit: 'fixedDeposit',
  recurringDeposit: 'recurringDeposit'
};

const SECTION_ICONS: Record<DepositAccountSectionId, LucideIcon> = {
  summary: PiggyBank,
  transactions: ArrowRightLeft,
  charges: Receipt
};

export function DepositAccountDetailView({
  account,
  clientId,
  kind,
  permissions,
  lifecyclePermissions,
  reportOrgName = '',
  transactionActionPermissions = {
    undoTransaction: false,
    viewJournal: false
  }
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  kind: ClientDepositAccountKind;
  permissions: AccountOfficerPermissions;
  lifecyclePermissions?: DepositAccountActionPermissions;
  reportOrgName?: string;
  transactionActionPermissions?: DepositTransactionActionPermissions;
}) {
  const listKind = LIST_KIND[kind];
  const sectionIds = useMemo(
    () => DEPOSIT_ACCOUNT_SECTIONS.map((section) => section.id),
    []
  );
  const navItems = useMemo(
    () =>
      DEPOSIT_ACCOUNT_SECTIONS.map((section) => ({
        ...section,
        icon: SECTION_ICONS[section.id]
      })),
    []
  );
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    DEPOSIT_ACCOUNT_DEFAULT_SECTION
  );

  const headerActions =
    isTermDepositAccountKind(kind) && lifecyclePermissions ? (
      <DepositAccountActions
        kind={kind}
        account={account}
        clientId={clientId}
        permissions={lifecyclePermissions}
        reportOrgName={reportOrgName}
      />
    ) : (
      <AccountOfficerActions
        kind={kind}
        account={account}
        clientId={clientId}
        permissions={permissions}
        presentation="standalone"
      />
    );

  return (
    <DetailPage
      header={
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
              <DetailBackLink
                href={clientAccountListPath(clientId, listKind)}
                label={LIST_LABELS[kind]}
              />
            </div>
          }
          title={savingsAccountProductName(account)}
          status={{ label: account.status.value ?? 'Unknown' }}
          meta={
            <div className="space-y-1">
              <AccountCustomerMeta name={account.clientName} />
              <p>
                {KIND_LABELS[kind]} · {account.accountNo}
              </p>
              <AccountExternalIdMeta externalId={account.externalId} />
              <AccountOfficerMeta label="Field officer" name={account.fieldOfficerName} />
            </div>
          }
          actions={headerActions}
        />
      }
      sidebar={
        <DetailSectionNav
          items={navItems}
          activeId={activeSection}
          onSelect={(id) => setSection(id)}
        />
      }
    >
      <DepositAccountSectionPanel
        section={activeSection as DepositAccountSectionId}
        account={account}
        kind={(isTermDepositAccountKind(kind) ? kind : 'fixedDeposit') as TermDepositAccountKind}
        clientId={clientId}
        reportOrgName={reportOrgName}
        transactionActionPermissions={transactionActionPermissions}
      />
    </DetailPage>
  );
}

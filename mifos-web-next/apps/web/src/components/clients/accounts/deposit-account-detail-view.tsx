'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, FineractSavingsAccountDetail } from '@mifos/api-client';
import {
  DetailBackLink,
  DetailField,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import {
  DepositAccountFieldOfficerActions,
  type DepositAccountFieldOfficerPermissions
} from '@/components/clients/accounts/actions/deposit-account-field-officer-actions';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import {
  clientAccountListPath,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import { savingsAccountProductName } from '@/lib/fineract/savings-account-display';

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

export function DepositAccountDetailView({
  account,
  clientId,
  kind,
  permissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  kind: ClientDepositAccountKind;
  permissions: DepositAccountFieldOfficerPermissions;
}) {
  const listKind = LIST_KIND[kind];

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
              <DetailBackLink
                href={clientAccountListPath(clientId, listKind)}
                label={LIST_LABELS[kind]}
              />
            </div>
          }
          title={savingsAccountProductName(account)}
          status={{ label: account.status.value ?? 'Unknown' }}
          meta={
            <p>
              {KIND_LABELS[kind]} · {account.accountNo}
            </p>
          }
          actions={
            <DepositAccountFieldOfficerActions
              account={account}
              clientId={clientId}
              kind={kind}
              permissions={permissions}
            />
          }
        />
      }
    >
      <DetailSection title="Summary">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Account number">{account.accountNo}</DetailField>
          <DetailField label="Status">{account.status.value}</DetailField>
          <DetailField label="Field officer">{account.fieldOfficerName ?? '—'}</DetailField>
          <DetailField label="Currency">{account.currency.code}</DetailField>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          Additional account details and transactions will be added in a future update.
        </p>
      </DetailSection>
    </DetailPage>
  );
}

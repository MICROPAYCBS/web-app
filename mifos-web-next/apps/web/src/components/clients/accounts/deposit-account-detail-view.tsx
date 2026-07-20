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
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import {
  AccountOfficerActions,
  type AccountOfficerPermissions
} from '@/components/clients/accounts/actions/account-officer-actions';
import { AccountOfficerMeta } from '@/components/clients/accounts/account-officer-meta';
import { AccountExternalIdMeta } from '@/components/clients/accounts/account-external-id-meta';
import { formatTimelineActorByRole } from '@/lib/fineract/account-timeline-display';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import {
  clientAccountListPath,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import {
  formatSavingsAccountDate,
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

export function DepositAccountDetailView({
  account,
  clientId,
  kind,
  permissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  kind: ClientDepositAccountKind;
  permissions: AccountOfficerPermissions;
}) {
  const listKind = LIST_KIND[kind];
  const timeline = account.timeline;
  const timelineRows = [
    {
      label: 'Submitted',
      date: timeline?.submittedOnDate,
      by: formatTimelineActorByRole(timeline, 'submitted')
    },
    {
      label: 'Approved',
      date: timeline?.approvedOnDate,
      by: formatTimelineActorByRole(timeline, 'approved')
    },
    {
      label: 'Activated',
      date: timeline?.activatedOnDate,
      by: formatTimelineActorByRole(timeline, 'activated')
    },
    {
      label: 'Closed',
      date: timeline?.closedOnDate,
      by: formatTimelineActorByRole(timeline, 'closed')
    }
  ].filter((row) => row.date);

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
            <div className="space-y-1">
              <p>
                {KIND_LABELS[kind]} · {account.accountNo}
              </p>
              <AccountExternalIdMeta externalId={account.externalId} />
              <AccountOfficerMeta label="Field officer" name={account.fieldOfficerName} />
            </div>
          }
          actions={
            <AccountOfficerActions
              kind={kind}
              account={account}
              clientId={clientId}
              permissions={permissions}
              presentation="standalone"
            />
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Summary">
          <DetailFieldGrid>
            <DetailField label="Account number">{account.accountNo}</DetailField>
            <DetailField label="External ID">{account.externalId?.trim() || '—'}</DetailField>
            <DetailField label="Status">{account.status.value}</DetailField>
            <DetailField label="Field officer">{account.fieldOfficerName ?? '—'}</DetailField>
            <DetailField label="Currency">{account.currency.code}</DetailField>
          </DetailFieldGrid>
          <p className="mt-4 text-sm text-muted-foreground">
            Additional account details and transactions will be added in a future update.
          </p>
        </DetailSection>

        <DetailSection title="Timeline">
          {timelineRows.length ? (
            <ul className="space-y-4">
              {timelineRows.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {formatSavingsAccountDate(row.date)}
                    {row.by ? ` · ${row.by}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No timeline events recorded.</p>
          )}
        </DetailSection>
      </div>
    </DetailPage>
  );
}

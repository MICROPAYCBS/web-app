'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailBackLink,
  DetailField,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import {
  LoanAccountFieldOfficerActions,
  type LoanAccountFieldOfficerPermissions
} from '@/components/clients/loan-account/actions/loan-account-field-officer-actions';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-accounts';

function loanProductName(account: FineractLoanAccountDetail) {
  return account.productName ?? account.loanProductName ?? `Loan account #${account.id}`;
}

export function LoanAccountDetailView({
  account,
  clientId,
  permissions
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  permissions: LoanAccountFieldOfficerPermissions;
}) {
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
    >
      <DetailSection title="Summary">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Account number">{account.accountNo}</DetailField>
          <DetailField label="Status">{account.status.value}</DetailField>
          <DetailField label="Loan officer">{account.loanOfficerName ?? '—'}</DetailField>
          <DetailField label="Currency">{account.currency.code}</DetailField>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          Additional loan details, schedule, and transactions will be added in a future update.
        </p>
      </DetailSection>
    </DetailPage>
  );
}

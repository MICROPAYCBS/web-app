/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import type { ClientDepositAccountKind } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DepositAccountDetailView } from '@/components/clients/accounts/deposit-account-detail-view';
import type { DepositAccountFieldOfficerPermissions } from '@/components/clients/accounts/actions/deposit-account-field-officer-actions';
import { LoanAccountDetailView } from '@/components/clients/loan-account/loan-account-detail-view';
import type { LoanAccountFieldOfficerPermissions } from '@/components/clients/loan-account/actions/loan-account-field-officer-actions';
import { ClientAccountDetailPlaceholder } from '@/components/clients/detail/client-account-detail-placeholder';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { LOAN_OFFICER_CONFIG } from '@/lib/fineract/account-field-officer-config';
import {
  CLIENT_ACCOUNT_RESERVED_IDS,
  clientGeneralPath
} from '@/lib/fineract/client-action-paths';
import {
  clientAccountListPath,
  isClientAccountSegment,
  productKindFromAccountSegment,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import { getDepositAccount } from '@/lib/fineract/deposit-account-officer-commands';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { loadAccountCashierForSession } from '@/lib/fineract/load-account-cashier';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

const ACCOUNT_TITLES: Record<
  ReturnType<typeof productKindFromAccountSegment>,
  { title: string; backLabel: string }
> = {
  loan: { title: 'Loan account', backLabel: 'loans' },
  savings: { title: 'Savings account', backLabel: 'savings' },
  fixedDeposit: { title: 'Fixed deposit account', backLabel: 'fixed deposits' },
  recurringDeposit: { title: 'Recurring deposit account', backLabel: 'recurring deposits' },
  share: { title: 'Share account', backLabel: 'shares' }
};

function depositFieldOfficerPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): DepositAccountFieldOfficerPermissions {
  return {
    assignStaff: can(session, 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT'),
    reassignStaff: can(session, {
      all: ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT']
    })
  };
}

function loanOfficerPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): LoanAccountFieldOfficerPermissions {
  return {
    assignOfficer: can(session, LOAN_OFFICER_CONFIG.assignPermission),
    reassignOfficer: can(session, {
      all: [LOAN_OFFICER_CONFIG.assignPermission, LOAN_OFFICER_CONFIG.removePermission]
    })
  };
}

function listBackLinks(clientId: string, kind: ClientAccountProductKind) {
  const copy = ACCOUNT_TITLES[kind];
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
      <DetailBackLink href={clientGeneralPath(clientId)} label="Back to customer" />
      <span className="text-muted-foreground" aria-hidden>
        ·
      </span>
      <DetailBackLink href={clientAccountListPath(clientId, kind)} label={copy.backLabel} />
    </div>
  );
}

export default async function ClientAccountGeneralPage({
  params
}: {
  params: Promise<{ clientId: string; accountSegment: string; accountId: string }>;
}) {
  const { clientId, accountSegment, accountId } = await params;

  if (!isClientAccountSegment(accountSegment) || CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const kind = productKindFromAccountSegment(accountSegment);

  if (kind === 'savings') {
    notFound();
  }

  const session = await getServerSession();
  const copy = ACCOUNT_TITLES[kind];

  if (kind === 'loan') {
    const result = await tryFineractLoad(
      () => getLoanAccount(accountId),
      'Could not load loan account.'
    );

    if (!result.ok) {
      return (
        <ListPage backLink={listBackLinks(clientId, 'loan')} title={copy.title}>
          <LoadErrorAlert title="Could not load loan account" message={result.message} />
        </ListPage>
      );
    }

    if (!result.data) {
      notFound();
    }

    const cashierSnapshot = await loadAccountCashierForSession(session, {
      accountId: result.data.id,
      accountKind: 'loan',
      currencyCode: result.data.currency.code ?? 'USD'
    });

    return (
      <Suspense fallback={null}>
        <LoanAccountDetailView
          account={result.data}
          clientId={clientId}
          permissions={loanOfficerPermissions(session)}
          cashierSnapshot={cashierSnapshot}
        />
      </Suspense>
    );
  }

  if (kind === 'fixedDeposit' || kind === 'recurringDeposit') {
    const depositKind: ClientDepositAccountKind = kind;
    const result = await tryFineractLoad(
      () => getDepositAccount(depositKind, accountId),
      `Could not load ${copy.title.toLowerCase()}.`
    );

    if (!result.ok) {
      return (
        <ListPage backLink={listBackLinks(clientId, kind)} title={copy.title}>
          <LoadErrorAlert title={`Could not load ${copy.title.toLowerCase()}`} message={result.message} />
        </ListPage>
      );
    }

    if (!result.data) {
      notFound();
    }

    return (
      <Suspense fallback={null}>
        <DepositAccountDetailView
          account={result.data}
          clientId={clientId}
          kind={depositKind}
          permissions={depositFieldOfficerPermissions(session)}
        />
      </Suspense>
    );
  }

  return (
    <ClientAccountDetailPlaceholder
      title={copy.title}
      accountId={accountId}
      backHref={clientAccountListPath(clientId, kind)}
      backLabel={copy.backLabel}
    />
  );
}

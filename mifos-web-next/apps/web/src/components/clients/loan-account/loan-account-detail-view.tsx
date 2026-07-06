'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import {
  LoanAccountActions,
  type LoanAccountActionPermissions
} from '@/components/clients/loan-account/actions/loan-account-actions';
import { AccountDetailActionsBar } from '@/components/clients/accounts/actions/account-detail-actions-bar';
import { AccountOfficerActions } from '@/components/clients/accounts/actions/account-officer-actions';
import { AccountOfficerMeta } from '@/components/clients/accounts/account-officer-meta';
import { LoanAccountDetailPanel } from '@/components/clients/loan-account/loan-account-detail-panel';
import { LoanAccountDetailSidebar } from '@/components/clients/loan-account/loan-account-detail-sidebar';
import {
  LoanAccountSectionNavSkeleton,
  LoanAccountSummarySkeleton
} from '@/components/clients/loan-account/loan-account-detail-skeleton';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  MoneyValue
} from '@/components/composites';
import type { AccountCashierSnapshot } from '@/lib/fineract/cashier-display';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { LOAN_OFFICER_CONFIG } from '@/lib/fineract/account-field-officer-config';
import {
  loanAccountClientBackLabel,
  loanAccountCurrencyCode,
  loanAccountDelinquencyBanner,
  loanAccountHasSummary,
  loanAccountProductName,
  loanAccountStatusVariant
} from '@/lib/fineract/loan-account-display';
import { loanAccountSectionIds } from '@/components/clients/loan-account/loan-account-detail-sidebar';
import type { LoanAccountStandingInstructionContext } from '@/components/clients/loan-account/loan-account-standing-instruction-context';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

export function LoanAccountDetailView({
  account,
  clientId,
  permissions,
  cashierSnapshot = null,
  reportOrgName,
  standingInstructions = null
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  permissions: LoanAccountActionPermissions;
  cashierSnapshot?: AccountCashierSnapshot | null;
  reportOrgName: string;
  standingInstructions?: LoanAccountStandingInstructionContext | null;
}) {
  const currency = loanAccountCurrencyCode(account);
  const summary = account.summary;
  const delinquencyMessage = loanAccountDelinquencyBanner(account);
  const includeCashier = Boolean(cashierSnapshot);
  const standingInstructionsEnabled = standingInstructions != null;
  const showSidebar = useMemo(
    () =>
      loanAccountSectionIds(account, {
        includeCashier,
        standingInstructions: standingInstructionsEnabled
      }).length > 1,
    [account, includeCashier, standingInstructionsEnabled]
  );

  return (
    <DetailPage
      headerClassName="print:hidden"
      header={
        <div className="space-y-4">
          {delinquencyMessage ? (
            <div
              className="flex items-start gap-3 rounded-md border border-border bg-muted/50 px-4 py-3"
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Loan in arrears</p>
                <p className="text-muted-foreground">{delinquencyMessage}</p>
              </div>
            </div>
          ) : null}

          <DetailHeader
            backLink={
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
                <DetailBackLink
                  href={clientGeneralPath(clientId)}
                  label={loanAccountClientBackLabel(account)}
                />
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <Link
                  href={clientAccountListPath(clientId, 'loan')}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Loans
                </Link>
              </div>
            }
            title={loanAccountProductName(account)}
            status={{
              label: account.status.value ?? 'Unknown',
              variant: loanAccountStatusVariant(account.status.code)
            }}
            actions={
              <AccountDetailActionsBar
                officer={
                  <AccountOfficerActions
                    kind="loan"
                    account={account}
                    clientId={clientId}
                    permissions={{
                      assign: permissions.assignOfficer,
                      reassign: permissions.reassignOfficer
                    }}
                    presentation="inline"
                  />
                }
              >
                <LoanAccountActions
                  account={account}
                  clientId={clientId}
                  permissions={permissions}
                />
              </AccountDetailActionsBar>
            }
            meta={
              <div className="space-y-1">
                <p className="tabular-nums">Account no. {account.accountNo}</p>
                <AccountOfficerMeta
                  label={LOAN_OFFICER_CONFIG.officerLabel}
                  name={account.loanOfficerName}
                />
                {loanAccountHasSummary(account) ? (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current balance
                    </span>
                    <MoneyValue
                      amount={summary?.totalOutstanding}
                      currencyCode={currency}
                      emphasize
                      className="text-base"
                    />
                  </div>
                ) : account.proposedPrincipal != null ? (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Proposed amount
                    </span>
                    <MoneyValue
                      amount={account.proposedPrincipal}
                      currencyCode={currency}
                      emphasize
                      className="text-base"
                    />
                  </div>
                ) : null}
                {summary?.totalOverdue != null && summary.totalOverdue > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Arrears{' '}
                    <MoneyValue amount={summary.totalOverdue} currencyCode={currency} />
                  </p>
                ) : null}
              </div>
            }
          />
        </div>
      }
      sidebar={
        showSidebar ? (
          <div className="print:hidden">
            <Suspense fallback={<LoanAccountSectionNavSkeleton account={account} />}>
              <LoanAccountDetailSidebar
                account={account}
                includeCashier={includeCashier}
                standingInstructions={standingInstructionsEnabled}
              />
            </Suspense>
          </div>
        ) : undefined
      }
    >
      <Suspense fallback={<LoanAccountSummarySkeleton />}>
        <LoanAccountDetailPanel
          account={account}
          clientId={clientId}
          cashierSnapshot={cashierSnapshot}
          reportOrgName={reportOrgName}
          standingInstructions={standingInstructions}
        />
      </Suspense>
    </DetailPage>
  );
}

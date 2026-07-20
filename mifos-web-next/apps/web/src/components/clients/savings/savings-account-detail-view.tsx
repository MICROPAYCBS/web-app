/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractRolePermissionUsage, FineractSavingsAccountDetail } from '@mifos/api-client';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  MoneyValue
} from '@/components/composites';
import { ResourcePendingCheckerBanner } from '@/components/composites/resource-pending-checker-banner';
import {
  SavingsAccountActions,
  type SavingsAccountActionPermissions
} from '@/components/clients/savings/actions/savings-account-actions';
import { AccountDetailActionsBar } from '@/components/clients/accounts/actions/account-detail-actions-bar';
import { AccountOfficerActions } from '@/components/clients/accounts/actions/account-officer-actions';
import { AccountOfficerMeta } from '@/components/clients/accounts/account-officer-meta';
import { AccountExternalIdMeta } from '@/components/clients/accounts/account-external-id-meta';
import { SavingsAccountDetailPanel } from '@/components/clients/savings/savings-account-detail-panel';
import { SavingsAccountDetailSidebar } from '@/components/clients/savings/savings-account-detail-sidebar';
import {
  SavingsAccountSectionNavSkeleton,
  SavingsAccountSummarySkeleton
} from '@/components/clients/savings/savings-account-detail-skeleton';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import {
  savingsAccountBlockedMessage,
  savingsAccountClientBackLabel,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsAccountStatusVariant
} from '@/lib/fineract/savings-account-display';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';
import type { ResourcePendingWorkflowContext } from '@/lib/fineract/resource-pending-checker';
import {
  savingsAccountPendingCheckerScope,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';

export function SavingsAccountDetailView({
  account,
  clientId,
  reportOrgName,
  permissions,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords,
  transactionActionPermissions = {
    undoTransaction: false,
    undoTransfer: false,
    modifyTransaction: false,
    viewJournal: false
  },
  pendingCheckerActions = [],
  pendingApprovalWorkflowContext,
  makerCheckerTaskPermissions = []
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  reportOrgName: string;
  permissions: SavingsAccountActionPermissions;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
  transactionActionPermissions?: SavingsTransactionActionPermissions;
  pendingCheckerActions?: ResourcePendingCheckerAction[];
  pendingApprovalWorkflowContext?: ResourcePendingWorkflowContext;
  makerCheckerTaskPermissions?: FineractRolePermissionUsage[];
}) {
  const currency = savingsAccountCurrencyCode(account);
  const blockedMessage = savingsAccountBlockedMessage(account);
  const onHold = account.onHoldFunds ?? account.savingsAmountOnHold ?? 0;

  return (
    <DetailPage
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

          <ResourcePendingCheckerBanner
            scope={savingsAccountPendingCheckerScope(account.id)}
            actions={pendingCheckerActions}
            approvalWorkflowContext={pendingApprovalWorkflowContext}
            taskPermissions={makerCheckerTaskPermissions}
            status={account.status}
          />

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
              <AccountDetailActionsBar
                officer={
                  <AccountOfficerActions
                    kind="savings"
                    account={account}
                    clientId={clientId}
                    permissions={{
                      assign: permissions.assignStaff,
                      reassign: permissions.reassignStaff
                    }}
                    presentation="inline"
                  />
                }
              >
                <SavingsAccountActions
                  account={account}
                  clientId={clientId}
                  reportOrgName={reportOrgName}
                  permissions={permissions}
                  pendingCheckerActions={pendingCheckerActions}
                />
              </AccountDetailActionsBar>
            }
            meta={
              <div className="space-y-1">
                <p className="tabular-nums">Account no. {account.accountNo}</p>
                <AccountExternalIdMeta externalId={account.externalId} />
                <AccountOfficerMeta label="Field officer" name={account.fieldOfficerName} />
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
        <Suspense fallback={<SavingsAccountSectionNavSkeleton />}>
          <SavingsAccountDetailSidebar canViewAudits={canViewAudits} />
        </Suspense>
      }
    >
      <Suspense fallback={<SavingsAccountSummarySkeleton />}>
        <SavingsAccountDetailPanel
          account={account}
          clientId={clientId}
          reportOrgName={reportOrgName}
          canViewAudits={canViewAudits}
          auditEntries={auditEntries}
          auditLoadFailed={auditLoadFailed}
          auditTotalRecords={auditTotalRecords}
          transactionActionPermissions={transactionActionPermissions}
        />
      </Suspense>
    </DetailPage>
  );
}

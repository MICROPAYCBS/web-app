/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractShareAccountDetail } from '@mifos/api-client';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  MoneyValue
} from '@/components/composites';
import { AccountDetailActionsBar } from '@/components/clients/accounts/actions/account-detail-actions-bar';
import { AccountExternalIdMeta } from '@/components/clients/accounts/account-external-id-meta';
import {
  ShareAccountActions,
  type ShareAccountActionPermissions
} from '@/components/clients/shares/actions/share-account-actions';
import { ShareAccountDetailPanel } from '@/components/clients/shares/share-account-detail-panel';
import { ShareAccountDetailSidebar } from '@/components/clients/shares/share-account-detail-sidebar';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import {
  shareAccountClientBackLabel,
  shareAccountCurrencyCode,
  shareAccountProductName,
  shareAccountStatusVariant
} from '@/lib/fineract/share-account-display';

export function ShareAccountDetailView({
  account,
  clientId,
  permissions,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords
}: {
  account: FineractShareAccountDetail;
  clientId: string;
  permissions: ShareAccountActionPermissions;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
}) {
  const currency = shareAccountCurrencyCode(account);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              <DetailBackLink
                href={clientGeneralPath(clientId)}
                label={shareAccountClientBackLabel(account)}
              />
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <Link
                href={clientAccountListPath(clientId, 'share')}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Share accounts
              </Link>
            </div>
          }
          title={shareAccountProductName(account)}
          status={{
            label: account.status.value ?? 'Unknown',
            variant: shareAccountStatusVariant(account.status)
          }}
          actions={
            <AccountDetailActionsBar>
              <ShareAccountActions
                account={account}
                clientId={clientId}
                permissions={permissions}
              />
            </AccountDetailActionsBar>
          }
          meta={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Account {account.accountNo}</span>
              <AccountExternalIdMeta externalId={account.externalId} />
              {account.currentMarketPrice != null ? (
                <span>
                  Market price{' '}
                  <MoneyValue amount={account.currentMarketPrice} currencyCode={currency} />
                </span>
              ) : null}
            </div>
          }
        />
      }
      sidebar={
        <Suspense fallback={null}>
          <ShareAccountDetailSidebar canViewAudits={canViewAudits} />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <ShareAccountDetailPanel
          account={account}
          canViewAudits={canViewAudits}
          auditEntries={auditEntries}
          auditLoadFailed={auditLoadFailed}
          auditTotalRecords={auditTotalRecords}
        />
      </Suspense>
    </DetailPage>
  );
}

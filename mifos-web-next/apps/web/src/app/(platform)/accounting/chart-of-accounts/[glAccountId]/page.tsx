/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { GlAccountDetailView } from '@/components/accounting/chart-of-accounts/gl-account-detail-view';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import {
  buildGlAccountEnquiryDetailsUrl,
  isLegacyGlAccountHistoryTab,
  parseGlAccountHistoryQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

export default async function GlAccountDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ glAccountId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { glAccountId } = await params;
  const queryParams = await searchParams;
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa'))) {
    notFound();
  }

  const id = Number(glAccountId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  // Legacy History tab bookmarks → enquiry details page.
  if (isLegacyGlAccountHistoryTab(queryParams)) {
    const defaultTransactionDate = await getDefaultTransactionDate().catch(() => undefined);
    const historyQuery = parseGlAccountHistoryQuery(queryParams, id, {
      defaultTransactionDate
    });
    redirect(
      buildGlAccountEnquiryDetailsUrl(id, {
        officeId: historyQuery.officeId,
        currencyCode: historyQuery.currencyCode,
        departmentId: historyQuery.departmentId,
        fromDate: historyQuery.fromDate,
        toDate: historyQuery.toDate
      })
    );
  }

  const account = await getGlAccount(id);
  if (!account) {
    notFound();
  }

  return (
    <GlAccountDetailView
      account={account}
      canCreate={can(session, 'CREATE_GLACCOUNT')}
      canUpdate={can(session, 'UPDATE_GLACCOUNT')}
      canDelete={can(session, 'DELETE_GLACCOUNT')}
    />
  );
}

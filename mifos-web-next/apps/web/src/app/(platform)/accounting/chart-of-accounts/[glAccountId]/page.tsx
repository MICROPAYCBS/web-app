/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlAccountDetailView } from '@/components/accounting/chart-of-accounts/gl-account-detail-view';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listDepartments } from '@/lib/fineract/departments';
import { fetchGlAccountEnquiry } from '@/lib/fineract/gl-account-enquiry';
import {
  glAccountEnquiryHasRequiredFilters,
  parseGlAccountDetailReturnTo,
  parseGlAccountDetailTab,
  parseGlAccountHistoryQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
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

  const tab = parseGlAccountDetailTab(queryParams);
  const returnTo = parseGlAccountDetailReturnTo(queryParams);
  const defaultTransactionDate = await getDefaultTransactionDate().catch(() => undefined);
  const historyQuery = parseGlAccountHistoryQuery(queryParams, id, {
    defaultTransactionDate
  });

  const account = await getGlAccount(id);
  if (!account) {
    notFound();
  }

  const loadHistoryLookups = tab === 'history';
  const loadHistoryReport =
    loadHistoryLookups && glAccountEnquiryHasRequiredFilters(historyQuery);

  const [offices, currencies, departments, historyResult] = await Promise.all([
    loadHistoryLookups ? listOfficeOptions() : Promise.resolve([]),
    loadHistoryLookups ? getOrganizationSelectedCurrencies() : Promise.resolve([]),
    loadHistoryLookups ? listDepartments().catch(() => []) : Promise.resolve([]),
    loadHistoryReport
      ? tryFineractLoad(
          () => fetchGlAccountEnquiry(historyQuery),
          'Could not load account history.'
        )
      : Promise.resolve({
          ok: true as const,
          data: { lines: [], summary: null, glAccount: null }
        })
  ]);

  return (
    <GlAccountDetailView
      account={account}
      tab={tab}
      returnTo={returnTo}
      historyQuery={historyQuery}
      historyLines={historyResult.ok ? historyResult.data.lines : []}
      historySummary={historyResult.ok ? historyResult.data.summary : null}
      historyGlAccount={historyResult.ok ? historyResult.data.glAccount : null}
      historyLoadError={historyResult.ok ? null : historyResult.message}
      offices={offices}
      departments={departments}
      currencies={currencies}
      canCreate={can(session, 'CREATE_GLACCOUNT')}
      canUpdate={can(session, 'UPDATE_GLACCOUNT')}
      canDelete={can(session, 'DELETE_GLACCOUNT')}
    />
  );
}

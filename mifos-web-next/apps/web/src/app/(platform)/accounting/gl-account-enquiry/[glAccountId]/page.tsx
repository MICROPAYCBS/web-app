/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlAccountEnquiryDetailsView } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-details-view';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listDepartments } from '@/lib/fineract/departments';
import { fetchGlAccountEnquiry } from '@/lib/fineract/gl-account-enquiry';
import {
  glAccountEnquiryHasRequiredFilters,
  parseGlAccountDetailReturnTo,
  parseGlAccountHistoryQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function GlAccountEnquiryDetailsPage({
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
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  const returnTo = parseGlAccountDetailReturnTo(queryParams);
  const defaultTransactionDate = await getDefaultTransactionDate().catch(() => undefined);
  const query = parseGlAccountHistoryQuery(queryParams, id, {
    defaultTransactionDate
  });

  const account = await getGlAccount(id);
  if (!account) {
    notFound();
  }

  const loadReport = glAccountEnquiryHasRequiredFilters(query);

  const [offices, currencies, departments, historyResult] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies(),
    listDepartments().catch(() => []),
    loadReport
      ? tryFineractLoad(
          () => fetchGlAccountEnquiry(query),
          'Could not load account history.'
        )
      : Promise.resolve({
          ok: true as const,
          data: { lines: [], summary: null, glAccount: null }
        })
  ]);

  return (
    <GlAccountEnquiryDetailsView
      account={account}
      returnTo={returnTo}
      query={query}
      lines={historyResult.ok ? historyResult.data.lines : []}
      summary={historyResult.ok ? historyResult.data.summary : null}
      historyGlAccount={historyResult.ok ? historyResult.data.glAccount : null}
      loadError={historyResult.ok ? null : historyResult.message}
      offices={offices}
      departments={departments}
      currencies={currencies}
    />
  );
}

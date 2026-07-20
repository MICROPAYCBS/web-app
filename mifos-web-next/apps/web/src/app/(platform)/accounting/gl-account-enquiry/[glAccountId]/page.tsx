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
import { buildGlAccountEnquirySummaryFromLedger } from '@/lib/accounting/gl-account-enquiry-summary';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listDepartments } from '@/lib/fineract/departments';
import {
  glAccountEnquiryHasRequiredFilters,
  parseGlAccountDetailReturnTo,
  parseGlAccountHistoryQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { retrieveGlAccountLedger } from '@/lib/fineract/gl-account-ledger';
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

  const loadLedger = glAccountEnquiryHasRequiredFilters(query);

  const [offices, currencies, departments, ledgerResult] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies(),
    listDepartments().catch(() => []),
    loadLedger
      ? tryFineractLoad(
          () =>
            retrieveGlAccountLedger(id, {
              startDate: query.fromDate ?? '',
              endDate: query.toDate ?? '',
              officeId: query.officeId,
              currencyCode: query.currencyCode,
              departmentId: query.departmentId
            }),
          'Could not load account ledger.'
        )
      : Promise.resolve({ ok: true as const, data: null })
  ]);

  const ledger = ledgerResult.ok ? ledgerResult.data : null;
  const summary = ledger ? buildGlAccountEnquirySummaryFromLedger(ledger) : null;
  const entries = ledger?.entries ?? [];

  return (
    <GlAccountEnquiryDetailsView
      account={account}
      returnTo={returnTo}
      query={query}
      entries={entries}
      summary={summary}
      loadError={ledgerResult.ok ? null : ledgerResult.message}
      offices={offices}
      departments={departments}
      currencies={currencies}
    />
  );
}

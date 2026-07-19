/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { AdvancedGlAccountEnquiryPageContent } from '@/components/accounting/advanced-gl-account-enquiry/advanced-gl-account-enquiry-page-content';
import {
  advancedGlAccountEnquiryHasActiveFilters,
  parseAdvancedGlAccountEnquiryListQuery
} from '@/lib/fineract/advanced-gl-account-enquiry-query';
import { enquireGlAccounts } from '@/lib/fineract/gl-account-enquiry';
import {
  buildGlAccountEnquiryUrl,
  parseGlAccountEnquiryListQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

function readSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export default async function GlAccountEnquiryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa'))) {
    notFound();
  }

  const params = await searchParams;

  // Legacy stretchy-report enquiry bookmarks → account History tab.
  if (readSingleParam(params, 'glAccountId')) {
    redirect(buildGlAccountEnquiryUrl(parseGlAccountEnquiryListQuery(params)));
  }

  const query = parseAdvancedGlAccountEnquiryListQuery(params);
  const hasSearch = advancedGlAccountEnquiryHasActiveFilters(query);

  const [currencies, offices, enquiryResult] = await Promise.all([
    getOrganizationSelectedCurrencies(),
    listOfficeOptions(),
    hasSearch
      ? tryFineractLoad(
          () => enquireGlAccounts(query),
          'Could not load GL account enquiry results.'
        )
      : Promise.resolve({ ok: true as const, data: [] })
  ]);

  return (
    <AdvancedGlAccountEnquiryPageContent
      query={query}
      rows={enquiryResult.ok ? enquiryResult.data : []}
      loadError={enquiryResult.ok ? null : enquiryResult.message}
      offices={offices}
      currencies={currencies}
    />
  );
}

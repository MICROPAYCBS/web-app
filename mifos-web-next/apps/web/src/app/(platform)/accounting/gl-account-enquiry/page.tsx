/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlAccountEnquiryPageContent } from '@/components/accounting/gl-account-enquiry/gl-account-enquiry-page-content';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import {
  fetchGlAccountEnquiry,
  listGlAccountEnquiryOptions
} from '@/lib/fineract/gl-account-enquiry';
import { parseGlAccountEnquiryListQuery } from '@/lib/fineract/gl-account-enquiry-query';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { getServerSession } from '@/lib/session/server';

export default async function GlAccountEnquiryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.journal'))) {
    notFound();
  }

  const params = await searchParams;
  const [defaultTransactionDate, currencies, offices] = await Promise.all([
    getDefaultTransactionDate().catch(() => undefined),
    getOrganizationSelectedCurrencies(),
    listOfficeOptions()
  ]);
  const defaultCurrencyCode =
    currencies.find((currency) => currency.code?.trim())?.code?.trim() ?? '';
  const defaultOfficeId = offices[0] ? String(offices[0].id) : '';
  const query = parseGlAccountEnquiryListQuery(params, {
    defaultTransactionDate,
    defaultCurrencyCode,
    defaultOfficeId
  });
  const [result, glAccounts] = await Promise.all([
    fetchGlAccountEnquiry(query),
    listGlAccountEnquiryOptions()
  ]);

  return (
    <GlAccountEnquiryPageContent
      lines={result.lines}
      query={query}
      summary={result.summary}
      glAccount={result.glAccount}
      offices={offices}
      glAccounts={glAccounts}
      currencies={currencies}
      defaultCurrencyCode={defaultCurrencyCode}
      defaultOfficeId={defaultOfficeId}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LegalTendersPageContent } from '@/components/organization/legal-tenders-page-content';
import { listCurrencyLegalTenders } from '@/lib/fineract/legal-tenders';
import { legalTenderLoadFailure } from '@/lib/fineract/legal-tender-load';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

function resolveOrganizationCurrency(
  currencies: Awaited<ReturnType<typeof getOrganizationSelectedCurrencies>>,
  currencyCode: string
) {
  const normalized = decodeURIComponent(currencyCode).trim().toUpperCase();
  return currencies.find((row) => row.code?.toUpperCase() === normalized) ?? null;
}

export default async function OrganizationCurrencyLegalTendersPage({
  params
}: {
  params: Promise<{ currencyCode: string }>;
}) {
  const { currencyCode } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.legalTenders'))) {
    notFound();
  }

  const currencies = await getOrganizationSelectedCurrencies();
  const currency = resolveOrganizationCurrency(currencies, currencyCode);
  if (!currency?.code) {
    notFound();
  }
  const resolvedCurrencyCode = currency.code;

  const result = await tryFineractLoad(
    () => listCurrencyLegalTenders(resolvedCurrencyCode, { includeInactive: true }),
    'Could not load legal tenders for this currency.'
  );
  const loadFailure = result.ok ? null : legalTenderLoadFailure(result.message, result.status);

  return (
    <LegalTendersPageContent
      currencyCode={resolvedCurrencyCode}
      decimalPlaces={currency.decimalPlaces ?? 2}
      legalTenders={result.ok ? result.data : []}
      loadError={loadFailure?.message}
      loadErrorHint={loadFailure?.hint}
      loadErrorStatus={loadFailure?.status}
      canCreate={can(session, 'CREATE_LEGAL_TENDER')}
      canEdit={can(session, 'UPDATE_LEGAL_TENDER')}
      canDelete={can(session, 'DELETE_LEGAL_TENDER')}
    />
  );
}

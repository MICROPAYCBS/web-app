/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LegalTenderHubPageContent } from '@/components/organization/legal-tender-hub-page-content';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationLegalTendersHubPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.legalTenders'))) {
    notFound();
  }

  const currencies = await getOrganizationSelectedCurrencies();

  return <LegalTenderHubPageContent currencies={currencies} />;
}

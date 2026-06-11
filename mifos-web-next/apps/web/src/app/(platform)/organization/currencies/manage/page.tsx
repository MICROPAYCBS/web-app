/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ManageCurrenciesPageContent } from '@/components/organization/manage-currencies-page-content';
import { getOrganizationCurrenciesConfiguration } from '@/lib/fineract/organization-currencies';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationManageCurrenciesPage() {
  const session = await getServerSession();
  if (!can(session, 'UPDATE_CURRENCY')) {
    notFound();
  }

  const configuration = await getOrganizationCurrenciesConfiguration();

  return (
    <ManageCurrenciesPageContent
      initialSelectedCurrencies={configuration.selectedCurrencyOptions}
      currencyOptions={configuration.currencyOptions}
    />
  );
}

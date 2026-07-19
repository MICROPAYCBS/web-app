/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { MigrateOpeningBalancesForm } from '@/components/accounting/migrate-opening-balances-form';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function MigrateOpeningBalancesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.migrateBalances'))) {
    notFound();
  }

  const [offices, currencies] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies()
  ]);

  return (
    <MigrateOpeningBalancesForm
      offices={offices}
      currencies={currencies}
      canDefine={can(session, 'DEFINEOPENINGBALANCE_JOURNALENTRY')}
    />
  );
}

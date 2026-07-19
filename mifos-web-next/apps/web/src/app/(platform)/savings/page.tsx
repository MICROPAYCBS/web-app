/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SavingsAccountsPageContent } from '@/components/savings/savings-accounts-page-content';
import { parsePortfolioListQuery } from '@/lib/fineract/portfolio-list-query';
import { fetchSavingsAccountsList } from '@/lib/fineract/savings-accounts-list';
import { getServerSession } from '@/lib/session/server';

export default async function SavingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('savings.list'))) {
    notFound();
  }

  const params = await searchParams;
  const query = parsePortfolioListQuery(params);
  const initialPage = await fetchSavingsAccountsList(query);

  return <SavingsAccountsPageContent initialPage={initialPage} initialQuery={query} />;
}

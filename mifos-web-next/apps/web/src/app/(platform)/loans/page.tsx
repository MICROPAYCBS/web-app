/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LoansPageContent } from '@/components/loans/loans-page-content';
import { fetchLoansList } from '@/lib/fineract/loans-list';
import { parsePortfolioListQuery } from '@/lib/fineract/portfolio-list-query';
import { getServerSession } from '@/lib/session/server';

export default async function LoansPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('loans.list'))) {
    notFound();
  }

  const params = await searchParams;
  const query = parsePortfolioListQuery(params);
  const initialPage = await fetchLoansList(query);

  return <LoansPageContent initialPage={initialPage} initialQuery={query} />;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LoanOriginatorsPageContent } from '@/components/organization/loan-originators-page-content';
import { listLoanOriginators } from '@/lib/fineract/loan-originators';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationLoanOriginatorsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.loanOriginators'))) {
    notFound();
  }

  const originators = await listLoanOriginators();
  const canDelete = can(session, 'DELETE_LOAN_ORIGINATOR');

  return <LoanOriginatorsPageContent originators={originators} canDelete={canDelete} />;
}

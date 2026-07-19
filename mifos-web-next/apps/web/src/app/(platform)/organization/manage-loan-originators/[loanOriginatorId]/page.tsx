/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { LoanOriginatorDetailEditUrlPanel } from '@/components/organization/loan-originator-detail-edit-url-panel';
import { LoanOriginatorDetailView } from '@/components/organization/loan-originator-detail-view';
import {
  getLoanOriginator,
  getLoanOriginatorTemplate
} from '@/lib/fineract/loan-originators';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationLoanOriginatorDetailPage({
  params
}: {
  params: Promise<{ loanOriginatorId: string }>;
}) {
  const { loanOriginatorId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.loanOriginators'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_LOAN_ORIGINATOR');

  let originator;
  try {
    originator = await getLoanOriginator(loanOriginatorId);
  } catch {
    notFound();
  }

  const template = canEdit ? await getLoanOriginatorTemplate() : undefined;

  return (
    <>
      <LoanOriginatorDetailView originator={originator} canEdit={canEdit} />
      {canEdit && template ? (
        <Suspense fallback={null}>
          <LoanOriginatorDetailEditUrlPanel originator={originator} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}

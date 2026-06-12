/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { LoanOriginatorFormPage } from '@/components/organization/loan-originator-form-page';
import { getLoanOriginator, getLoanOriginatorTemplate } from '@/lib/fineract/loan-originators';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationEditLoanOriginatorPage({
  params
}: {
  params: Promise<{ loanOriginatorId: string }>;
}) {
  const { loanOriginatorId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.loanOriginators.update'))) {
    notFound();
  }

  let originator;
  let template;
  try {
    [originator, template] = await Promise.all([
      getLoanOriginator(loanOriginatorId),
      getLoanOriginatorTemplate()
    ]);
  } catch {
    notFound();
  }

  return (
    <LoanOriginatorFormPage
      mode="edit"
      loanOriginatorId={originator.id}
      template={template}
      initial={{
        externalId: originator.externalId,
        name: originator.name,
        status: originator.status,
        originatorTypeId:
          originator.originatorType?.id != null ? String(originator.originatorType.id) : '',
        channelTypeId:
          originator.channelType?.id != null ? String(originator.channelType.id) : ''
      }}
    />
  );
}

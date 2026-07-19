/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ClientStandingInstructionsView } from '@/components/clients/standing-instructions/client-standing-instructions-view';
import { StandingInstructionCreateUrlPanel } from '@/components/clients/standing-instructions/standing-instruction-create-url-panel';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { getClient } from '@/lib/fineract/clients';
import { resolveClientOfficeId } from '@/lib/fineract/resolve-client-office-id';
import { standingInstructionFromAccountTypeParam } from '@/lib/fineract/standing-instruction-account-type';
import {
  getStandingInstructionTemplate,
  listStandingInstructions
} from '@/lib/fineract/standing-instructions';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';
import { getServerSession } from '@/lib/session/server';

export default async function ClientStandingInstructionsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  if (!can(session, 'READ_STANDINGINSTRUCTION')) {
    notFound();
  }

  const client = await getClient(clientId);
  const clientName = clientDisplayName(client);
  const fromAccountType = standingInstructionFromAccountTypeParam('fromsavings');
  const status = clientStatusKind(client);
  const showCreate = !isClientUnderTransfer(status);

  const fromOfficeId = await resolveClientOfficeId(clientId, client);

  const [listPage, template] = await Promise.all([
    listStandingInstructions({
      clientId,
      clientName,
      fromAccountType
    }),
    getStandingInstructionTemplate({
      fromClientId: clientId,
      fromOfficeId,
      fromAccountType
    })
  ]);

  return (
    <>
      <ClientStandingInstructionsView
        clientId={clientId}
        clientName={clientName}
        officeId={fromOfficeId}
        fromAccountType={fromAccountType}
        initialItems={listPage.pageItems}
        transferTypeOptions={template.transferTypeOptions ?? []}
        showCreate={showCreate}
      />
      <Suspense fallback={null}>
        <StandingInstructionCreateUrlPanel
          clientId={clientId}
          fromOfficeId={fromOfficeId}
          initialTemplate={template}
        />
      </Suspense>
    </>
  );
}

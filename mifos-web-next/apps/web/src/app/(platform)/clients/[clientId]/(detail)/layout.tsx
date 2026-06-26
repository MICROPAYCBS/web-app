/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ClientDetailShell } from '@/components/clients/detail/client-detail-shell';
import { ClientDetailShellSkeleton } from '@/components/clients/detail/client-detail-skeleton';
import { getClientProfileImage, clientHasProfileImage } from '@/lib/fineract/client-image';
import { getClientSignatureInfo } from '@/lib/fineract/client-signature';
import { buildClientDatatableNavItems } from '@/lib/fineract/client-datatable-nav';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { getClient } from '@/lib/fineract/clients';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

async function ClientDetailLayoutBody({
  children,
  clientId
}: {
  children: ReactNode;
  clientId: string;
}) {
  const session = await getServerSession();

  const clientResult = await tryFineractLoad(
    () => getClient(clientId),
    'Could not load this customer.'
  );

  if (!clientResult.ok) {
    if (clientResult.status === 404) {
      notFound();
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
        <LoadErrorAlert title="Customer unavailable" message={clientResult.message} />
      </div>
    );
  }

  const client = clientResult.data;

  const [profileImageSrc, signatureInfo, datatableNavItems] = await Promise.all([
    clientHasProfileImage(client)
      ? getClientProfileImage(clientId).catch(() => null)
      : Promise.resolve(null),
    getClientSignatureInfo(clientId).catch(() => ({
      hasSignature: false,
      documentId: undefined
    })),
    buildClientDatatableNavItems(clientId, client, session)
  ]);

  const canCreateImage = can(session, 'CREATE_CLIENTIMAGE');
  const canDeleteImage = can(session, 'DELETE_CLIENTIMAGE');

  return (
    <ClientDetailShell
      client={client}
      initialImageSrc={profileImageSrc}
      canCreateImage={canCreateImage}
      canDeleteImage={canDeleteImage}
      hasSignature={signatureInfo.hasSignature}
      signatureDocumentId={signatureInfo.documentId}
      datatableNavItems={datatableNavItems}
    >
      {children}
    </ClientDetailShell>
  );
}

export default async function ClientDetailLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<ClientDetailShellSkeleton />}>
        <ClientDetailLayoutBody clientId={clientId}>{children}</ClientDetailLayoutBody>
      </Suspense>
    </div>
  );
}

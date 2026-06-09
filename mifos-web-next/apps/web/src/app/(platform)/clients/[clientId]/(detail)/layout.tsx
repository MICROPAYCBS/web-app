/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { FineractHttpError } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ClientDetailShell } from '@/components/clients/detail/client-detail-shell';
import { getClientProfileImage } from '@/lib/fineract/client-image';
import { getClientSignatureInfo } from '@/lib/fineract/client-signature';
import { buildClientDatatableNavItems } from '@/lib/fineract/client-datatable-nav';
import { getClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export default async function ClientDetailLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [profileImageSrc, signatureInfo, datatableNavItems] = await Promise.all([
    getClientProfileImage(clientId).catch(() => null),
    getClientSignatureInfo(clientId).catch(() => ({
      hasSignature: false,
      documentId: undefined
    })),
    buildClientDatatableNavItems(clientId, client, session)
  ]);

  const canCreateImage = can(session, 'CREATE_CLIENTIMAGE');
  const canDeleteImage = can(session, 'DELETE_CLIENTIMAGE');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
    </div>
  );
}

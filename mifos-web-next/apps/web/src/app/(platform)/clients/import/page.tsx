/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import type { FineractClientIdentifierTemplate } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import { ClientsImportPanel } from '@/components/clients/clients-import-panel';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { buildClientsImportLookups } from '@/lib/clients/clients-import-lookups';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { getClientTemplate } from '@/lib/fineract/clients';
import { listCustomerClasses } from '@/lib/fineract/customer-classes';
import { listStaff } from '@/lib/fineract/staff';
import { getServerSession } from '@/lib/session/server';

export default async function ClientsImportPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('clients.create'))) {
    notFound();
  }

  const canCreate = can(session, resolvePermission('clients.create'));
  const defaultOfficeId = session?.officeId && session.officeId > 0 ? session.officeId : undefined;

  const [template, staff, identifierTemplate, customerClasses] = await Promise.all([
    getClientTemplate(defaultOfficeId),
    listStaff().catch(() => []),
    getClientIdentifierTemplate(1).catch(
      (): FineractClientIdentifierTemplate => ({
        allowedDocumentTypes: [],
        identityTypeOptions: []
      })
    ),
    listCustomerClasses().catch(() => [])
  ]);

  if (!template.customerClassOptions?.length && customerClasses.length > 0) {
    template.customerClassOptions = customerClasses;
  }

  const lookups = buildClientsImportLookups({ template, staff, identifierTemplate });

  return (
    <ListPage
      title="Import customers"
      description="Choose Micropay or legacy template, analyze your Excel file, then create person customers with live progress."
      backLink={<DetailBackLink href="/clients" label="Back to customers" />}
    >
      <ClientsImportPanel
        lookups={lookups}
        defaultOfficeId={defaultOfficeId}
        canDownload={canCreate}
        canCreate={canCreate}
      />
    </ListPage>
  );
}

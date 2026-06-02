/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ClientRelationsSections,
  type ClientDatatableSection
} from '@/components/clients/detail/client-relations-sections';
import {
  asManyToOneRows,
  getClientDatatableRows,
  listClientDatatables
} from '@/lib/fineract/client-datatables';

export default async function ClientRelationsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const registrations = await listClientDatatables().catch(() => []);

  const sections: ClientDatatableSection[] = [];
  for (const registration of registrations) {
    const data = await getClientDatatableRows(clientId, registration.registeredTableName);
    const rows = asManyToOneRows(data);
    if (rows.length > 0) {
      sections.push({
        registeredTableName: registration.registeredTableName,
        rows
      });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Custom data tables with multiple rows linked to this client.
      </p>
      <ClientRelationsSections sections={sections} />
    </div>
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { BulkImportDetailPageContent } from '@/components/organization/bulk-import-detail-page-content';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { listBulkImportHistory } from '@/lib/fineract/bulk-import';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationBulkImportDetailPage({
  params
}: {
  params: Promise<{ importName: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.bulkImport'))) {
    notFound();
  }

  const { importName } = await params;
  const definition = getBulkImportDefinition(importName);
  if (!definition) {
    notFound();
  }

  const [offices, imports] = await Promise.all([
    definition.formFields >= 1 ? listOfficeOptions() : Promise.resolve([]),
    listBulkImportHistory(definition.entityType)
  ]);
  const canDownload = can(session, definition.downloadPermission);

  return (
    <BulkImportDetailPageContent
      definition={definition}
      offices={offices}
      imports={imports}
      canDownload={canDownload}
    />
  );
}

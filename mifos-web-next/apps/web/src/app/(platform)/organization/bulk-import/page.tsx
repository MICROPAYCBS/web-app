/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { BulkImportPageContent } from '@/components/organization/bulk-import-page-content';
import { BULK_IMPORT_DEFINITIONS } from '@/lib/fineract/bulk-import-config';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationBulkImportPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.bulkImport'))) {
    notFound();
  }

  return <BulkImportPageContent options={BULK_IMPORT_DEFINITIONS} />;
}

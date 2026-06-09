/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { EntityDatatableChecksPageContent } from '@/components/organization/entity-datatable-checks-page-content';
import {
  getEntityDatatableCheckTemplate,
  listEntityDatatableChecks
} from '@/lib/fineract/entity-datatable-checks';
import { getServerSession } from '@/lib/session/server';

export default async function EntityDatatableChecksPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.entityChecks'))) {
    notFound();
  }

  const canCreate = can(session, 'CREATE_ENTITY_DATATABLE_CHECK');
  const [page, template] = await Promise.all([
    listEntityDatatableChecks(),
    canCreate ? getEntityDatatableCheckTemplate() : Promise.resolve(null)
  ]);

  return (
    <EntityDatatableChecksPageContent
      checks={page.pageItems ?? []}
      template={template}
    />
  );
}

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
import { EntityToEntityMappingPageContent } from '@/components/system/entity-to-entity-mapping-page-content';
import { listEntityMappingTypes } from '@/lib/fineract/entity-to-entity-mapping';
import { getServerSession } from '@/lib/session/server';

export default async function EntityToEntityMappingPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.entityMapping'))) {
    notFound();
  }

  const mappingTypes = await listEntityMappingTypes();

  return (
    <Suspense fallback={null}>
      <EntityToEntityMappingPageContent
        mappingTypes={mappingTypes}
        canCreate={can(session, 'CREATE_ENTITYMAPPING')}
        canUpdate={can(session, 'UPDATE_ENTITYMAPPING')}
        canDelete={can(session, 'DELETE_ENTITYMAPPING')}
      />
    </Suspense>
  );
}

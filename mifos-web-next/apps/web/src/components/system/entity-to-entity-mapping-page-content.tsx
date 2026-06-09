'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityMappingType } from '@mifos/api-client';
import { EntityToEntityMappingView } from '@/components/system/entity-to-entity-mapping-view';

export function EntityToEntityMappingPageContent({
  mappingTypes,
  canCreate,
  canUpdate,
  canDelete
}: {
  mappingTypes: FineractEntityMappingType[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <EntityToEntityMappingView
      mappingTypes={mappingTypes}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}

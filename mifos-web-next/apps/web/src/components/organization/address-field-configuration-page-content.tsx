'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFieldConfiguration } from '@mifos/api-client';
import { AddressFieldConfigurationTable } from '@/components/organization/address-field-configuration-table';
import { ListPage } from '@/components/composites/list-page';

export function AddressFieldConfigurationPageContent({
  rows
}: {
  rows: FineractFieldConfiguration[];
}) {
  return (
    <ListPage
      title="Address field configuration"
      description="See which customer address fields are enabled, required, and validated. Changes are applied on the server by your administrator."
    >
      <AddressFieldConfigurationTable rows={rows} />
    </ListPage>
  );
}

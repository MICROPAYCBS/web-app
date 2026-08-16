'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentOption, TaxGroupListItem } from '@mifos/api-client';
import { TaxGroupCreateUrlPanel } from '@/components/products/tax/tax-group-create-url-panel';
import { TaxGroupsPageContent } from '@/components/products/tax/tax-groups-page-content';

export function TaxGroupsPageClient({
  groups,
  componentOptions,
  canCreate
}: {
  groups: TaxGroupListItem[];
  componentOptions: TaxComponentOption[];
  canCreate: boolean;
}) {
  return (
    <>
      <TaxGroupsPageContent groups={groups} />
      {canCreate ? <TaxGroupCreateUrlPanel componentOptions={componentOptions} /> : null}
    </>
  );
}

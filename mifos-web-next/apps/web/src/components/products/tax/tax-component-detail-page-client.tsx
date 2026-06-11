'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentDetail } from '@mifos/api-client';
import { TaxComponentDetailView } from '@/components/products/tax/tax-component-detail-view';
import { TaxComponentEditUrlPanel } from '@/components/products/tax/tax-component-edit-url-panel';

export function TaxComponentDetailPageClient({
  component,
  canEdit
}: {
  component: TaxComponentDetail;
  canEdit: boolean;
}) {
  return (
    <>
      <TaxComponentDetailView component={component} canEdit={canEdit} />
      {canEdit ? <TaxComponentEditUrlPanel component={component} /> : null}
    </>
  );
}

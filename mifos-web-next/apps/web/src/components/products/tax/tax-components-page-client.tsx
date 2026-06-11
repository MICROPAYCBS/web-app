'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentListItem, TaxComponentTemplate } from '@mifos/api-client';
import { TaxComponentCreateUrlPanel } from '@/components/products/tax/tax-component-create-url-panel';
import { TaxComponentsPageContent } from '@/components/products/tax/tax-components-page-content';

export function TaxComponentsPageClient({
  components,
  template,
  canCreate
}: {
  components: TaxComponentListItem[];
  template: TaxComponentTemplate;
  canCreate: boolean;
}) {
  return (
    <>
      <TaxComponentsPageContent components={components} />
      {canCreate ? <TaxComponentCreateUrlPanel template={template} /> : null}
    </>
  );
}

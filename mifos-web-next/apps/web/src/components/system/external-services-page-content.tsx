'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceProperty } from '@mifos/api-client';
import { ExternalServicesView } from '@/components/system/external-services-view';
import type { ExternalServiceSlug } from '@/lib/fineract/external-service-display';

export function ExternalServicesPageContent({
  configurations,
  canUpdate
}: {
  configurations: Record<ExternalServiceSlug, FineractExternalServiceProperty[]>;
  canUpdate: boolean;
}) {
  return <ExternalServicesView configurations={configurations} canUpdate={canUpdate} />;
}

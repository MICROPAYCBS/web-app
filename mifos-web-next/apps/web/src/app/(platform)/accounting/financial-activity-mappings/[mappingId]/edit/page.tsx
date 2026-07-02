/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { financialActivityMappingEditPath } from '@/lib/fineract/financial-activity-mapping-paths';

/** Legacy edit URL → list with edit side panel. */
export default async function EditFinancialActivityMappingPage({
  params
}: {
  params: Promise<{ mappingId: string }>;
}): Promise<never> {
  const { mappingId } = await params;
  redirect(financialActivityMappingEditPath(mappingId));
}

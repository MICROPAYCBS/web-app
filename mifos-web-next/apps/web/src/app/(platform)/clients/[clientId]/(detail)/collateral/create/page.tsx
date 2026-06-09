/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { clientCollateralCreatePath } from '@/lib/fineract/client-secondary-list-paths';

/** Legacy create URL → list with create side panel. */
export default async function ClientCollateralCreatePage({
  params
}: {
  params: Promise<{ clientId: string }>;
}): Promise<never> {
  const { clientId } = await params;
  redirect(clientCollateralCreatePath(clientId));
}

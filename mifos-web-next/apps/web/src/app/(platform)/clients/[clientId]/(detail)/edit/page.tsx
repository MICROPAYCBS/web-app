/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';

/** Edit opens as a wide side panel on the client detail view (`?edit=1`). */
export default async function ClientEditPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}): Promise<never> {
  const { clientId } = await params;
  redirect(`/clients/${clientId}/general?edit=1`);
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { tellerEditPath } from '@/lib/fineract/teller-paths';

/** Legacy edit URL → detail with edit side panel. */
export default async function OrganizationTellerEditPage({
  params
}: {
  params: Promise<{ tellerId: string }>;
}): Promise<never> {
  const { tellerId } = await params;
  redirect(tellerEditPath(tellerId));
}

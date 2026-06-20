/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { clientDepositAccountCreatePath } from '@/lib/fineract/client-deposit-account-config';

/** Legacy create URL → list with create side panel. */
export default async function NewSavingsAccountPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}): Promise<never> {
  const { clientId } = await params;
  redirect(clientDepositAccountCreatePath(clientId, 'savings'));
}

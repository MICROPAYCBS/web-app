/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { legalTenderEditPath } from '@/lib/fineract/legal-tender-paths';

export default async function OrganizationCurrencyLegalTenderEditPage({
  params
}: {
  params: Promise<{ currencyCode: string; id: string }>;
}): Promise<never> {
  const { currencyCode, id } = await params;
  redirect(legalTenderEditPath(currencyCode, id));
}

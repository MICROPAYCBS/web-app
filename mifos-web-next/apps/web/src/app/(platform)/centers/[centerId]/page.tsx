/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { centerGeneralPath } from '@/lib/fineract/center-paths';

export default async function CenterDetailPage({
  params
}: {
  params: Promise<{ centerId: string }>;
}): Promise<never> {
  const { centerId } = await params;
  redirect(centerGeneralPath(centerId));
}

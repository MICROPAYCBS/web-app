/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CenterGeneralSections } from '@/components/centers/center-general-sections';
import { getCenter, getCenterSavingsAccounts, getCenterSummary } from '@/lib/fineract/centers';

export default async function CenterGeneralPage({
  params
}: {
  params: Promise<{ centerId: string }>;
}) {
  const { centerId } = await params;
  const [center, summary, savingsAccounts] = await Promise.all([
    getCenter(centerId),
    getCenterSummary(centerId),
    getCenterSavingsAccounts(centerId)
  ]);

  if (!center) {
    return null;
  }

  return (
    <CenterGeneralSections center={center} summary={summary} savingsAccounts={savingsAccounts} />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ProvisioningEntryDetailView } from '@/components/accounting/provisioning-entry-detail-view';
import {
  getProvisioningEntry,
  getProvisioningEntryLines
} from '@/lib/fineract/provisioning-entries';
import { getServerSession } from '@/lib/session/server';

export default async function ProvisioningEntryDetailPage({
  params
}: {
  params: Promise<{ entryId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.provisioning'))) {
    notFound();
  }

  const { entryId: entryIdParam } = await params;
  const entryId = Number(entryIdParam);
  if (!Number.isFinite(entryId)) {
    notFound();
  }

  const [entry, linesPage] = await Promise.all([
    getProvisioningEntry(entryId),
    getProvisioningEntryLines(entryId)
  ]);

  if (!entry) {
    notFound();
  }

  return <ProvisioningEntryDetailView entry={entry} lines={linesPage.pageItems} />;
}

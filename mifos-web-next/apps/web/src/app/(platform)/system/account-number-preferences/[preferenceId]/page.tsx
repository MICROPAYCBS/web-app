/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AccountNumberPreferenceDetailView } from '@/components/system/account-number-preference-detail-view';
import { getStructuredAccountNumberFormatsEnabled } from '@/lib/fineract/account-number-format-policy';
import { toAccountNumberFormatOfficeOptions } from '@/lib/fineract/account-number-format-offices';
import {
  getAccountNumberPreference,
  getAccountNumberPreferenceTemplate
} from '@/lib/fineract/account-number-preferences';
import { listOffices } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function AccountNumberPreferenceDetailPage({
  params
}: {
  params: Promise<{ preferenceId: string }>;
}) {
  const { preferenceId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.accountNumberPrefs'))) {
    notFound();
  }

  const id = Number(preferenceId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const structuredFormatsEnabled = await getStructuredAccountNumberFormatsEnabled();

  const [preference, template, offices] = await Promise.all([
    getAccountNumberPreference(id),
    getAccountNumberPreferenceTemplate(),
    structuredFormatsEnabled ? listOffices() : Promise.resolve([])
  ]);

  if (!preference) {
    notFound();
  }

  return (
    <AccountNumberPreferenceDetailView
      preference={preference}
      template={template}
      canUpdate={can(session, 'UPDATE_ACCOUNTNUMBERFORMAT')}
      canDelete={can(session, 'DELETE_ACCOUNTNUMBERFORMAT')}
      structuredFormatsEnabled={structuredFormatsEnabled}
      officeOptions={toAccountNumberFormatOfficeOptions(offices)}
    />
  );
}

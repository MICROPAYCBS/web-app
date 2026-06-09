/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AccountNumberPreferenceCreateUrlPanel } from '@/components/system/account-number-preference-create-url-panel';
import { AccountNumberPreferencesPageContent } from '@/components/system/account-number-preferences-page-content';
import {
  getAccountNumberPreferenceTemplate,
  listAccountNumberPreferences
} from '@/lib/fineract/account-number-preferences';
import { getServerSession } from '@/lib/session/server';

export default async function AccountNumberPreferencesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.accountNumberPrefs'))) {
    notFound();
  }

  const [preferences, template] = await Promise.all([
    listAccountNumberPreferences(),
    getAccountNumberPreferenceTemplate()
  ]);

  return (
    <>
      <AccountNumberPreferencesPageContent preferences={preferences} />
      {can(session, 'CREATE_ACCOUNTNUMBERFORMAT') ? (
        <Suspense fallback={null}>
          <AccountNumberPreferenceCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
    </>
  );
}

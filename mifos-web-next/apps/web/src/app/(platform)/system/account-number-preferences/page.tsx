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
  STRUCTURED_ACCOUNT_NUMBER_FORMATS_CONFIG_NAME,
  getStructuredAccountNumberFormatsEnabled
} from '@/lib/fineract/account-number-format-policy';
import {
  getAccountNumberPreferenceTemplate,
  listAccountNumberPreferences
} from '@/lib/fineract/account-number-preferences';
import { toAccountNumberFormatOfficeOptions } from '@/lib/fineract/account-number-format-offices';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listOffices } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function AccountNumberPreferencesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.accountNumberPrefs'))) {
    notFound();
  }

  const structuredFormatsEnabled = await getStructuredAccountNumberFormatsEnabled();

  const [preferences, template, structuredFormatsConfiguration, offices] = await Promise.all([
    listAccountNumberPreferences(),
    getAccountNumberPreferenceTemplate(),
    getGlobalConfigurationByName(STRUCTURED_ACCOUNT_NUMBER_FORMATS_CONFIG_NAME),
    structuredFormatsEnabled ? listOffices() : Promise.resolve([])
  ]);

  return (
    <>
      <AccountNumberPreferencesPageContent
        preferences={preferences}
        structuredFormatsConfiguration={structuredFormatsConfiguration}
        canUpdateConfiguration={can(session, 'UPDATE_CONFIGURATION')}
      />
      {can(session, 'CREATE_ACCOUNTNUMBERFORMAT') ? (
        <Suspense fallback={null}>
          <AccountNumberPreferenceCreateUrlPanel
            template={template}
            structuredFormatsEnabled={structuredFormatsEnabled}
            officeOptions={toAccountNumberFormatOfficeOptions(offices)}
          />
        </Suspense>
      ) : null}
    </>
  );
}

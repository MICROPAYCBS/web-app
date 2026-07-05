'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountNumberPreferenceListItem,
  FineractGlobalConfiguration
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { AccountNumberPreferencesTable } from '@/components/system/account-number-preferences-table';
import { StructuredAccountNumberFormatsAlert } from '@/components/system/structured-account-number-formats-alert';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AccountNumberPreferencesPageContent({
  preferences,
  structuredFormatsConfiguration,
  canUpdateConfiguration
}: {
  preferences: FineractAccountNumberPreferenceListItem[];
  structuredFormatsConfiguration: FineractGlobalConfiguration | null;
  canUpdateConfiguration: boolean;
}) {
  return (
    <ListPage
      title="Account number preferences"
      description="Configure how account numbers are generated for each account type."
      actions={
        <Can permission="CREATE_ACCOUNTNUMBERFORMAT">
          <Link
            href="/system/account-number-preferences?create=1"
            className={cn(buttonVariants())}
          >
            Create preference
          </Link>
        </Can>
      }
    >
      <div className="space-y-4">
        <StructuredAccountNumberFormatsAlert
          configuration={structuredFormatsConfiguration}
          canUpdateConfiguration={canUpdateConfiguration}
        />
        <AccountNumberPreferencesTable preferences={preferences} />
      </div>
    </ListPage>
  );
}

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
import { BranchCreateUrlPanel } from '@/components/organization/branch-create-url-panel';
import { BranchesPageContent } from '@/components/organization/branches-page-content';
import { getStructuredAccountNumberFormatsEnabled } from '@/lib/fineract/account-number-format-policy';
import { toBranchManagerOptions } from '@/lib/fineract/branch-manager-options';
import { listOfficeOptions, listOffices } from '@/lib/fineract/offices';
import { listStaff } from '@/lib/fineract/staff';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationOfficesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.offices'))) {
    notFound();
  }

  const canCreate = can(session, 'CREATE_OFFICE');
  const structuredAccountNumberFormatsEnabled = await getStructuredAccountNumberFormatsEnabled();
  const [offices, parentOptions, staff] = await Promise.all([
    listOffices(),
    canCreate ? listOfficeOptions() : Promise.resolve([]),
    canCreate ? listStaff() : Promise.resolve([])
  ]);

  return (
    <>
      <BranchesPageContent offices={offices} />
      {canCreate ? (
        <Suspense fallback={null}>
          <BranchCreateUrlPanel
            parentOptions={parentOptions}
            managerOptions={toBranchManagerOptions(staff)}
            structuredAccountNumberFormatsEnabled={structuredAccountNumberFormatsEnabled}
          />
        </Suspense>
      ) : null}
    </>
  );
}

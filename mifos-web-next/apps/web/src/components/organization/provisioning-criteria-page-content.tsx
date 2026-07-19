'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ProvisioningCriteriaTable } from '@/components/organization/provisioning-criteria-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { provisioningCriteriaCreatePath } from '@/lib/fineract/provisioning-criteria-paths';
import { cn } from '@/lib/utils';

export function ProvisioningCriteriaPageContent({
  criteria
}: {
  criteria: ProvisioningCriteriaListItem[];
}) {
  return (
    <ListPage
      title="Provisioning criteria"
      description="Rules that map loan delinquency categories to provisioning percentages and GL accounts."
      actions={
        <Can permission="CREATE_PROVISIONING_CRITERIA">
          <Link href={provisioningCriteriaCreatePath()} className={cn(buttonVariants())}>
            Create provisioning criteria
          </Link>
        </Can>
      }
    >
      <ProvisioningCriteriaTable criteria={criteria} />
    </ListPage>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractFinancialActivityMappingFormTemplate,
  FineractFinancialActivityMappingListItem
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { FinancialActivityMappingCreateUrlPanel } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-create-url-panel';
import { FinancialActivityMappingEditUrlPanel } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-edit-url-panel';
import { FinancialActivityMappingsTable } from '@/components/accounting/financial-activity-mappings/financial-activity-mappings-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { financialActivityMappingCreatePath } from '@/lib/fineract/financial-activity-mapping-paths';
import { cn } from '@/lib/utils';

export function FinancialActivityMappingsPageContent({
  mappings,
  template,
  canCreate,
  canUpdate
}: {
  mappings: FineractFinancialActivityMappingListItem[];
  template: FineractFinancialActivityMappingFormTemplate;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  return (
    <>
      <ListPage
        title="Financial activity mappings"
        description="Map organization-level financial activities to GL accounts for automated transfers."
        actions={
          <Can permission="CREATE_FINANCIALACTIVITYACCOUNT">
            <Link href={financialActivityMappingCreatePath()} className={cn(buttonVariants())}>
              <Plus className="mr-2 size-4" />
              Define mapping
            </Link>
          </Can>
        }
      >
        <FinancialActivityMappingsTable mappings={mappings} canUpdate={canUpdate} />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <FinancialActivityMappingCreateUrlPanel
            template={template}
            existingMappings={mappings}
          />
        </Suspense>
      ) : null}
      {canUpdate ? (
        <Suspense fallback={null}>
          <FinancialActivityMappingEditUrlPanel mappings={mappings} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}

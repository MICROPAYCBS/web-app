'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { IdentityType, IdentityTypeTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { IdentityTypeCreateUrlPanel } from '@/components/organization/identity-type-create-url-panel';
import { IdentityTypeEditUrlPanel } from '@/components/organization/identity-type-edit-url-panel';
import { IdentityTypesTable } from '@/components/organization/identity-types-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { identityTypeCreatePath } from '@/lib/fineract/identity-type-paths';
import { cn } from '@/lib/utils';

export function IdentityTypesPageContent({
  identityTypes,
  template,
  customerIdentifierCodeId,
  canCreate,
  canEdit,
  canDelete
}: {
  identityTypes: IdentityType[];
  template: IdentityTypeTemplate;
  customerIdentifierCodeId?: number;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Identity type guides"
        description="Manage format hints and validation rules for customer identifier types such as national ID or passport numbers."
        actions={
          <Can permission="CREATE_IDENTITYTYPE">
            <Link href={identityTypeCreatePath()} className={cn(buttonVariants())}>
              Create identity type guide
            </Link>
          </Can>
        }
      >
        <IdentityTypesTable
          identityTypes={identityTypes}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <IdentityTypeCreateUrlPanel
            template={template}
            existingIdentityTypes={identityTypes}
            customerIdentifierCodeId={customerIdentifierCodeId}
          />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <IdentityTypeEditUrlPanel identityTypes={identityTypes} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}

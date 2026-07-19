'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { DepartmentCreateUrlPanel } from '@/components/accounting/departments/department-create-url-panel';
import { DepartmentEditUrlPanel } from '@/components/accounting/departments/department-edit-url-panel';
import { DepartmentsTable } from '@/components/accounting/departments/departments-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { departmentCreatePath } from '@/lib/fineract/department-paths';
import type { Department, DepartmentTemplate } from '@/lib/fineract/departments';
import { cn } from '@/lib/utils';

export function DepartmentsPageContent({
  departments,
  template,
  canCreate,
  canEdit,
  canDelete
}: {
  departments: Department[];
  template: DepartmentTemplate;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Departments"
        description="Manage internal cost units within branches for departmental profit and loss reporting."
        actions={
          <Can permission="CREATE_DEPARTMENT">
            <Link href={departmentCreatePath()} className={cn(buttonVariants())}>
              Create department
            </Link>
          </Can>
        }
      >
        <DepartmentsTable departments={departments} canEdit={canEdit} canDelete={canDelete} />
      </ListPage>
      {canCreate ? (
        <Suspense fallback={null}>
          <DepartmentCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <DepartmentEditUrlPanel departments={departments} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}

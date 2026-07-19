/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DepartmentsPageContent } from '@/components/accounting/departments/departments-page-content';
import { getDepartmentTemplate, listDepartments } from '@/lib/fineract/departments';
import { getServerSession } from '@/lib/session/server';

export default async function AccountingDepartmentsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.departments'))) {
    notFound();
  }

  const [departments, template] = await Promise.all([listDepartments(), getDepartmentTemplate()]);

  return (
    <DepartmentsPageContent
      departments={departments}
      template={template}
      canCreate={can(session, 'CREATE_DEPARTMENT')}
      canEdit={can(session, 'UPDATE_DEPARTMENT')}
      canDelete={can(session, 'DELETE_DEPARTMENT')}
    />
  );
}

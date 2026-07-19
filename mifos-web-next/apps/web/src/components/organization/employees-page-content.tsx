'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaffListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { EmployeesTable } from '@/components/organization/employees-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmployeesPageContent({ staff }: { staff: FineractStaffListItem[] }) {
  return (
    <ListPage
      title="Employees"
      description="People who work at your institution and can be assigned as relationship officers on customers."
      actions={
        <Can permission="CREATE_STAFF">
          <Link href="/organization/employees?create=1" className={cn(buttonVariants())}>
            Create employee
          </Link>
        </Can>
      }
    >
      <EmployeesTable staff={staff} />
    </ListPage>
  );
}

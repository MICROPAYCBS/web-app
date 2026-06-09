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

import { EmployeeCreateUrlPanel } from '@/components/organization/employee-create-url-panel';

import { EmployeesPageContent } from '@/components/organization/employees-page-content';

import { listOfficeOptions } from '@/lib/fineract/offices';

import { listStaff } from '@/lib/fineract/staff';

import { getServerSession } from '@/lib/session/server';



export default async function OrganizationEmployeesPage() {

  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.employees'))) {

    notFound();

  }



  const canCreate = can(session, 'CREATE_STAFF');

  const [staff, offices] = await Promise.all([

    listStaff(),

    canCreate ? listOfficeOptions() : Promise.resolve([])

  ]);



  return (

    <>

      <EmployeesPageContent staff={staff} />

      {canCreate ? (

        <Suspense fallback={null}>

          <EmployeeCreateUrlPanel offices={offices} />

        </Suspense>

      ) : null}

    </>

  );

}


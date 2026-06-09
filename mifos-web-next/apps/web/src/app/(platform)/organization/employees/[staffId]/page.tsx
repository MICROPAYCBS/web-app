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

import { EmployeeEditUrlPanel } from '@/components/organization/employee-edit-url-panel';

import { EmployeeDetailView } from '@/components/organization/employee-detail-view';

import { getStaff, getStaffEditTemplate } from '@/lib/fineract/staff';

import { getServerSession } from '@/lib/session/server';



export default async function OrganizationEmployeeDetailPage({

  params

}: {

  params: Promise<{ staffId: string }>;

}) {

  const { staffId } = await params;

  const session = await getServerSession();



  if (!can(session, resolvePermission('organization.employees'))) {

    notFound();

  }



  const canEdit = can(session, 'UPDATE_STAFF');



  let staff;

  let editTemplate;

  try {

    [staff, editTemplate] = await Promise.all([

      getStaff(staffId),

      canEdit ? getStaffEditTemplate(staffId) : Promise.resolve(null)

    ]);

  } catch {

    notFound();

  }



  return (

    <>

      <EmployeeDetailView staff={staff} canEdit={canEdit} />

      {canEdit && editTemplate ? (

        <Suspense fallback={null}>

          <EmployeeEditUrlPanel

            staffId={editTemplate.id}

            offices={editTemplate.allowedOffices ?? []}

            initial={{

              officeId: editTemplate.officeId,

              firstname: editTemplate.firstname,

              lastname: editTemplate.lastname,

              isLoanOfficer: editTemplate.isLoanOfficer,

              mobileNo: editTemplate.mobileNo,

              joiningDate: editTemplate.joiningDate,

              isActive: editTemplate.isActive

            }}

          />

        </Suspense>

      ) : null}

    </>

  );

}


/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { redirect } from 'next/navigation';



/** Edit opens as a side panel on the employee detail view (`?edit=1`). */

export default async function OrganizationEmployeeEditPage({

  params

}: {

  params: Promise<{ staffId: string }>;

}): Promise<never> {

  const { staffId } = await params;

  redirect(`/organization/employees/${staffId}?edit=1`);

}


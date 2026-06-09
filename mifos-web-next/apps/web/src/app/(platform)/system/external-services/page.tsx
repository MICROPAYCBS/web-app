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

import { ExternalServicesPageContent } from '@/components/system/external-services-page-content';

import { configurationsBySlug } from '@/lib/fineract/external-service-display';

import { listAllExternalServiceConfigurations } from '@/lib/fineract/external-services';

import { getServerSession } from '@/lib/session/server';



export default async function ExternalServicesPage() {

  const session = await getServerSession();

  if (!can(session, resolvePermission('system.externalServices'))) {

    notFound();

  }



  const configurations = configurationsBySlug(await listAllExternalServiceConfigurations());



  return (

    <Suspense fallback={null}>

      <ExternalServicesPageContent

        configurations={configurations}

        canUpdate={can(session, 'UPDATE_EXTERNALSERVICES')}

      />

    </Suspense>

  );

}


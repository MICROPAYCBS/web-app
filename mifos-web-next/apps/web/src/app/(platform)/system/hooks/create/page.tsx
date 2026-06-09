/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { can, resolvePermission } from '@mifos/auth';

import { notFound } from 'next/navigation';

import { DetailBackLink } from '@/components/composites';

import { ListPage } from '@/components/composites/list-page';

import { HookForm } from '@/components/system/hook-form';

import { defaultHookFormValues } from '@/lib/fineract/hook-display';

import { getHookTemplate } from '@/lib/fineract/hooks';

import { getServerSession } from '@/lib/session/server';



export default async function CreateHookPage() {

  const session = await getServerSession();

  if (!can(session, resolvePermission('system.hooks')) || !can(session, 'CREATE_HOOK')) {

    notFound();

  }



  const template = await getHookTemplate();



  return (

    <ListPage

      backLink={<DetailBackLink href="/system/hooks" label="Back to hooks" />}

      title="Create hook"

      description="Configure a web callback or SMS bridge and choose the events that trigger it."

    >

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

        <HookForm mode="create" initialValues={defaultHookFormValues()} template={template} />

      </div>

    </ListPage>

  );

}


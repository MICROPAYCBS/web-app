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

import { hookToFormValues } from '@/lib/fineract/hook-display';

import { getHook, getHookTemplate } from '@/lib/fineract/hooks';

import { getServerSession } from '@/lib/session/server';



export default async function EditHookPage({

  params

}: {

  params: Promise<{ hookId: string }>;

}) {

  const { hookId } = await params;

  const session = await getServerSession();

  if (!can(session, resolvePermission('system.hooks')) || !can(session, 'UPDATE_HOOK')) {

    notFound();

  }



  const id = Number(hookId);

  if (!Number.isFinite(id)) {

    notFound();

  }



  const [hook, template] = await Promise.all([getHook(id), getHookTemplate()]);

  if (!hook) {

    notFound();

  }



  return (

    <ListPage

      backLink={

        <DetailBackLink href={`/system/hooks/${hook.id}`} label="Back to hook" />

      }

      title={`Edit hook: ${hook.displayName}`}

      description="Update hook settings and subscribed events."

    >

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

        <HookForm

          mode="edit"

          hookId={hook.id}

          initialValues={hookToFormValues(hook)}

          template={template}

          templateLocked

        />

      </div>

    </ListPage>

  );

}


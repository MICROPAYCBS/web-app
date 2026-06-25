'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ContactType, ContactTypeTemplate } from '@mifos/api-client';

import { Can } from '@mifos/auth';

import Link from 'next/link';

import { Suspense } from 'react';

import { ContactTypeCreateUrlPanel } from '@/components/organization/contact-type-create-url-panel';

import { ContactTypeEditUrlPanel } from '@/components/organization/contact-type-edit-url-panel';

import { ContactTypesTable } from '@/components/organization/contact-types-table';

import { ListPage } from '@/components/composites/list-page';

import { buttonVariants } from '@/components/ui/button';

import { contactTypeCreatePath } from '@/lib/fineract/contact-type-paths';

import { cn } from '@/lib/utils';



export function ContactTypesPageContent({

  contactTypes,

  template,

  canCreate,

  canEdit,

  canDelete

}: {

  contactTypes: ContactType[];

  template: ContactTypeTemplate;

  canCreate: boolean;

  canEdit: boolean;

  canDelete: boolean;

}) {

  return (

    <>

      <ListPage

        title="Contact types"

        description="Manage contact channels such as mobile numbers and email addresses. Define validation rules and which types are mandatory for customers."

        actions={

          <Can permission="CREATE_CONTACTTYPE">

            <Link href={contactTypeCreatePath()} className={cn(buttonVariants())}>

              Create contact type

            </Link>

          </Can>

        }

      >

        <ContactTypesTable contactTypes={contactTypes} canEdit={canEdit} canDelete={canDelete} />

      </ListPage>



      {canCreate ? (

        <Suspense fallback={null}>

          <ContactTypeCreateUrlPanel template={template} />

        </Suspense>

      ) : null}

      {canEdit ? (

        <Suspense fallback={null}>

          <ContactTypeEditUrlPanel contactTypes={contactTypes} template={template} />

        </Suspense>

      ) : null}

    </>

  );

}



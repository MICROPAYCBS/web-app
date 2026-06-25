'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ContactType, ContactTypeTemplate } from '@mifos/api-client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useEffect } from 'react';

import { ContactTypeFormSheet } from '@/components/organization/contact-type-form-sheet';



function contactTypeRevision(contactType: ContactType): string {

  return [

    contactType.typeCode,

    contactType.typeName,

    contactType.example ?? '',

    contactType.validationRegex ?? '',

    contactType.mandatory ?? false,

    contactType.displayOrder ?? '',

    contactType.status ?? ''

  ].join('|');

}



export function ContactTypeEditUrlPanel({

  contactTypes,

  template

}: {

  contactTypes: ContactType[];

  template: ContactTypeTemplate;

}) {

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const editId = searchParams.get('edit');

  const contactType =

    editId != null ? contactTypes.find((row) => String(row.id) === editId) : undefined;

  const open = contactType != null;



  useEffect(() => {

    if (editId != null && editId !== '' && contactType == null) {

      const params = new URLSearchParams(searchParams.toString());

      params.delete('edit');

      const qs = params.toString();

      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    }

  }, [editId, contactType, pathname, router, searchParams]);



  function handleOpenChange(next: boolean) {

    if (!next && editId != null) {

      const params = new URLSearchParams(searchParams.toString());

      params.delete('edit');

      const qs = params.toString();

      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    }

  }



  if (!contactType) {

    return null;

  }



  return (

    <ContactTypeFormSheet

      key={`${contactType.id}:${contactTypeRevision(contactType)}`}

      open={open}

      onOpenChange={handleOpenChange}

      mode="edit"

      contactType={contactType}

      template={template}

    />

  );

}



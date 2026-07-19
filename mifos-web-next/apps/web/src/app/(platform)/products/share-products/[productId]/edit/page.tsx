/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { assertCan, resolvePermission } from '@mifos/auth';

import { FineractHttpError } from '@mifos/api-client';

import { notFound, redirect } from 'next/navigation';

import { ShareProductWizard } from '@/components/products/share/wizard/share-product-wizard';

import {

  enrichShareProductTemplate,

  shareProductDraftFromTemplate

} from '@/lib/fineract/share-product-draft';

import { getShareProductForEdit } from '@/lib/fineract/share-products';

import { getServerSession } from '@/lib/session/server';



export default async function EditShareProductPage({

  params

}: {

  params: Promise<{ productId: string }>;

}) {

  const session = await getServerSession();

  if (!session) {

    redirect('/login');

  }



  try {

    assertCan(session, resolvePermission('products.share.update'));

  } catch {

    redirect('/forbidden');

  }



  const { productId } = await params;



  let rawTemplate;

  try {

    rawTemplate = await getShareProductForEdit(productId);

  } catch (err) {

    if (err instanceof FineractHttpError && err.status === 404) {

      notFound();

    }

    throw err;

  }



  const template = await enrichShareProductTemplate(rawTemplate);

  const initialDraft = shareProductDraftFromTemplate(template);



  return (

    <ShareProductWizard

      mode="edit"

      template={template}

      initialDraft={initialDraft}

      productId={productId}

    />

  );

}


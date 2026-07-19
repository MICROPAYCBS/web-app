/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { ListPage } from '@/components/composites/list-page';

import { Skeleton } from '@/components/ui/skeleton';



export interface FormPageSkeletonProps {

  title: string;

  description?: string;

  showBackLink?: boolean;

  fieldCount?: number;

}



function FormFieldSkeleton() {

  return (

    <div className="space-y-2" aria-hidden>

      <Skeleton className="h-4 w-24" />

      <Skeleton className="h-9 w-full rounded-md" />

    </div>

  );

}



/**

 * Loading placeholder for single-page {@link ListPage} forms (no step rail).

 */

export function FormPageSkeleton({

  title,

  description,

  showBackLink = true,

  fieldCount = 6

}: FormPageSkeletonProps) {

  return (

    <ListPage

      title={title}

      description={description}

      backLink={

        showBackLink ? (

          <Skeleton className="h-4 w-32" aria-hidden />

        ) : undefined

      }

    >

      <div className="mx-auto max-w-2xl space-y-6" aria-busy aria-label={`Loading ${title}`}>

        <div className="space-y-4 rounded-lg border border-border p-4">

          {Array.from({ length: fieldCount }).map((_, index) => (

            <FormFieldSkeleton key={index} />

          ))}

        </div>

        <div className="flex justify-end gap-2">

          <Skeleton className="h-9 w-20 rounded-md" />

          <Skeleton className="h-9 w-28 rounded-md" />

        </div>

      </div>

    </ListPage>

  );

}



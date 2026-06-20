/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { ListPageTableSkeleton } from '@/components/composites/list-page-table-skeleton';



export default function SystemReportsLoading() {

  return (

    <ListPageTableSkeleton

      title="Report configuration"

      description="Define report SQL, parameters, and which reports appear in the user reports menu."

      showSearch={false}

      columnCount={4}

    />

  );

}



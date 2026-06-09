'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { LoanProductCharge } from '@mifos/api-client';

import {

  getCoreRowModel,

  useReactTable,

  type ColumnDef

} from '@tanstack/react-table';

import { DataTable } from '@/components/composites/data-table/data-table';

import { EmptyState } from '@/components/composites';

import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

import { formatChargeAmountDisplay } from '@/lib/fineract/charge-display';



function chargeColumns(currencyCode?: string): ColumnDef<LoanProductCharge>[] {

  return [

    {

      accessorKey: 'name',

      header: 'Name',

      cell: ({ row }) => row.original.name ?? '—'

    },

    {

      id: 'chargeCalculationType',

      header: 'Charge type',

      cell: ({ row }) => enumOptionLabel(row.original.chargeCalculationType) ?? '—'

    },

    {

      accessorKey: 'amount',

      header: () => <span className="block w-full text-right">Amount</span>,

      cell: ({ row }) => (

        <span className="block w-full text-right tabular-nums">

          {formatChargeAmountDisplay(row.original, currencyCode)}

        </span>

      )

    },

    {

      id: 'chargeTimeType',

      header: 'Collected on',

      cell: ({ row }) => enumOptionLabel(row.original.chargeTimeType) ?? '—'

    }

  ];

}



export function ProductChargesTable({

  charges,

  currencyCode,

  emptyMessage

}: {

  charges: LoanProductCharge[];

  currencyCode?: string;

  emptyMessage: string;

}) {

  if (charges.length === 0) {

    return <EmptyState title={emptyMessage} />;

  }



  const table = useReactTable({

    data: charges,

    columns: chargeColumns(currencyCode),

    getCoreRowModel: getCoreRowModel()

  });



  return <DataTable table={table} stickyHeader={false} />;

}


